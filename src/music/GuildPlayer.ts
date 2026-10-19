import {
  AudioPlayerStatus,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  type VoiceConnection,
} from "@discordjs/voice";
import type { SendableChannels } from "discord.js";
import prism from "prism-media";
import type { Track } from "../types";
import { findRelatedTrack } from "./autoplay";
import { isAutoplayEnabled } from "./settings";
import { getAudioStreamUrl } from "./sources/youtube";

/** Cuántos IDs recientes se recuerdan para que el autoplay no repita canciones. */
const RECENT_IDS_LIMIT = 20;

/**
 * Reproductor de música de UN servidor: cola, reproducción, bucle y autoplay.
 *
 * Modelo mental:
 *  - `current` es lo que suena ahora mismo.
 *  - `queue` son las canciones PENDIENTES (no incluye la actual).
 *  - Cuando una canción termina, `handleTrackEnd` decide qué hacer (bucle, siguiente, autoplay).
 */
export class GuildPlayer {
  readonly queue: Track[] = [];
  current: Track | null = null;
  loopEnabled = false;

  private readonly audioPlayer = createAudioPlayer();
  private ffmpeg: prism.FFmpeg | null = null;
  /** Última canción que empezó a sonar; sirve de "semilla" para el autoplay. */
  private lastTrack: Track | null = null;
  private recentIds: string[] = [];
  /** Evita que dos llamadas simultáneas a `playNext` arranquen dos canciones a la vez. */
  private advancing = false;
  /** Se activa con /stop para que, al terminar la canción, no se encadene la siguiente. */
  private stopRequested = false;
  private relatedPending: Promise<void> | null = null;
  private destroyed = false;

  constructor(
    readonly guildId: string,
    private readonly connection: VoiceConnection,
    public textChannel: SendableChannels | null,
    private readonly onDestroy: () => void,
  ) {
    this.connection.subscribe(this.audioPlayer);

    // Una canción acabó (o fue saltada/detenida): decidimos qué sigue.
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => void this.handleTrackEnd());
    this.audioPlayer.on("error", (error) => console.error(`[player:${guildId}] Error de audio:`, error.message));

    this.connection.on(VoiceConnectionStatus.Disconnected, () => void this.handleDisconnect());
    this.connection.on(VoiceConnectionStatus.Destroyed, () => this.destroy());
  }

  // ───────────────────────── API pública ─────────────────────────

  /** Añade canciones al final de la cola y empieza a reproducir si no había nada sonando. */
  enqueue(tracks: Track[]): void {
    this.queue.push(...tracks);
    if (!this.current && !this.advancing) void this.playNext();
  }

  /** Pausa si está sonando, reanuda si estaba en pausa. Devuelve `null` si no hay nada. */
  togglePause(): "paused" | "resumed" | null {
    const { status } = this.audioPlayer.state;
    if (status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
      return "paused";
    }
    if (status === AudioPlayerStatus.Paused || status === AudioPlayerStatus.AutoPaused) {
      this.audioPlayer.unpause();
      return "resumed";
    }
    return null;
  }

  /** Salta la canción actual. Devuelve `false` si no había nada que saltar. */
  skip(): boolean {
    if (!this.current) return false;
    this.audioPlayer.stop(true); // dispara "Idle" → handleTrackEnd → siguiente canción
    return true;
  }

  /** Detiene la reproducción y vacía la cola. Devuelve `false` si no había nada sonando. */
  stop(): boolean {
    if (!this.current) return false;
    this.queue.length = 0;
    this.stopRequested = true;
    this.audioPlayer.stop(true);
    return true;
  }

  /** Activa/desactiva el bucle (la canción que termina vuelve al final de la cola). */
  toggleLoop(): boolean {
    this.loopEnabled = !this.loopEnabled;
    return this.loopEnabled;
  }

  /** Llamar cuando se activa el autoplay para que actúe de inmediato si hace falta. */
  onAutoplayEnabled(): void {
    if (!this.current) void this.playNext();
    else if (this.queue.length === 0) void this.addRelatedTrack();
  }

  /** Apaga todo: para el audio, vacía la cola y sale del canal de voz. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.queue.length = 0;
    this.current = null;
    this.audioPlayer.stop(true);
    this.disposeFfmpeg();
    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) this.connection.destroy();
    this.onDestroy();
  }

  // ─────────────────────── Lógica interna ────────────────────────

  /**
   * Se ejecuta cuando termina una canción (por acabarse, /skip o /stop).
   * Si el bucle está activo, la canción vuelve al final de la cola.
   */
  private async handleTrackEnd(): Promise<void> {
    const finished = this.current;
    this.current = null;
    this.disposeFfmpeg();

    if (this.stopRequested) {
      this.stopRequested = false;
      return;
    }
    if (finished && this.loopEnabled) this.queue.push(finished);

    await this.playNext();
  }

  /**
   * Arranca la siguiente canción válida de la cola.
   * Si una canción no se puede cargar, avisa y prueba con la siguiente.
   * Si la cola está vacía y el autoplay está activo, busca una canción relacionada.
   */
  private async playNext(): Promise<void> {
    if (this.advancing || this.destroyed) return;
    this.advancing = true;

    try {
      while (!this.destroyed) {
        if (this.queue.length === 0) {
          await this.addRelatedTrack();
          if (this.queue.length === 0) return; // nada más que reproducir
        }

        const track = this.queue.shift()!;
        const streamUrl = await getAudioStreamUrl(track);
        if (!streamUrl) {
          await this.say(`⚠️ No he podido cargar: **${track.title}**. Saltando...`);
          continue;
        }

        this.startPlayback(track, streamUrl);
        return;
      }
    } finally {
      this.advancing = false;
    }
  }

  /** Lanza FFmpeg sobre la URL de audio y se la entrega al reproductor de Discord. */
  private startPlayback(track: Track, streamUrl: string): void {
    this.current = track;
    this.lastTrack = track;

    this.ffmpeg = new prism.FFmpeg({
      args: [
        // Reconectar si el stream se corta a mitad de canción
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", streamUrl,
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-vn", // sin vídeo
        // PCM 16-bit estéreo a 48 kHz: el formato que espera @discordjs/voice
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
      ],
    });

    this.audioPlayer.play(createAudioResource(this.ffmpeg, { inputType: StreamType.Raw }));
    void this.say(`🎶 Reproduciendo: **${track.title}**`);

    // Con autoplay, dejamos la siguiente canción lista mientras suena esta.
    if (this.queue.length === 0) void this.addRelatedTrack();
  }

  /**
   * Añade a la cola una canción relacionada con la última reproducida (solo si el
   * autoplay está activo). Si ya hay una búsqueda en curso, espera a esa en vez de lanzar otra.
   */
  private addRelatedTrack(): Promise<void> {
    if (!isAutoplayEnabled(this.guildId) || !this.lastTrack) return Promise.resolve();
    if (this.relatedPending) return this.relatedPending;

    const seed = this.lastTrack;
    this.relatedPending = (async () => {
      const related = await findRelatedTrack(seed, this.recentIds);
      if (!related || this.destroyed) return;

      this.recentIds.push(related.videoId!);
      if (this.recentIds.length > RECENT_IDS_LIMIT) this.recentIds.shift();

      this.queue.push(related);
      await this.say(`🎶 Autoplay: **${related.title}**`);
    })().finally(() => {
      this.relatedPending = null;
    });

    return this.relatedPending;
  }

  /**
   * Discord puede desconectar al bot temporalmente (por ejemplo al moverlo de canal).
   * Esperamos unos segundos a que se reconecte solo; si no, cerramos el reproductor.
   */
  private async handleDisconnect(): Promise<void> {
    try {
      await Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      this.destroy();
    }
  }

  /** Mata el proceso de FFmpeg de la canción anterior para no dejar procesos huérfanos. */
  private disposeFfmpeg(): void {
    this.ffmpeg?.destroy();
    this.ffmpeg = null;
  }

  /** Envía un mensaje al canal de texto sin romper la reproducción si falla. */
  private async say(content: string): Promise<void> {
    try {
      await this.textChannel?.send(content);
    } catch (error) {
      console.error(`[player:${this.guildId}] No se pudo enviar el mensaje:`, error);
    }
  }
}
