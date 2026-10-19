import { VoiceConnectionStatus, entersState, joinVoiceChannel } from "@discordjs/voice";
import type { Guild, SendableChannels, VoiceBasedChannel } from "discord.js";
import { GuildPlayer } from "./GuildPlayer";

/** Registro de reproductores: uno por servidor. */
class PlayerManager {
  private readonly players = new Map<string, GuildPlayer>();

  get(guildId: string): GuildPlayer | undefined {
    return this.players.get(guildId);
  }

  /**
   * Devuelve el reproductor del servidor, uniéndose (o moviéndose) al canal de voz indicado.
   * Si el bot ya estaba conectado en otro canal, simplemente se mueve.
   */
  async connect(guild: Guild, voiceChannel: VoiceBasedChannel, textChannel: SendableChannels | null): Promise<GuildPlayer> {
    // Si ya hay una conexión en este servidor, joinVoiceChannel la reutiliza y la mueve de canal.
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    } catch (error) {
      if (!this.players.has(guild.id)) connection.destroy();
      throw new Error("No he podido entrar al canal de voz a tiempo.", { cause: error });
    }

    let player = this.players.get(guild.id);
    if (!player) {
      player = new GuildPlayer(guild.id, connection, textChannel, () => this.players.delete(guild.id));
      this.players.set(guild.id, player);
    } else {
      player.textChannel = textChannel;
    }
    return player;
  }
}

/** Instancia única compartida por todo el bot. */
export const playerManager = new PlayerManager();
