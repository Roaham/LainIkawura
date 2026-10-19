import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../../config";
import type { Track } from "../../types";

const execFileAsync = promisify(execFile);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

/** Forma mínima de lo que devuelve `yt-dlp --dump-single-json`. */
interface YtdlpEntry {
  id?: string;
  title?: string;
  duration?: number;
}
interface YtdlpResult extends YtdlpEntry {
  entries?: (YtdlpEntry | null)[];
}

/** Opciones comunes a todas las llamadas a yt-dlp (cookies, IPv4, user-agent...). */
function baseArgs(): string[] {
  const args = [
    "--quiet",
    "--no-warnings",
    "--no-check-certificates",
    "--source-address", "0.0.0.0", // fuerza IPv4
    "--user-agent", USER_AGENT,
  ];
  if (config.cookiesPath) args.push("--cookies", config.cookiesPath);
  return args;
}

/** Ejecuta yt-dlp y devuelve su stdout. No bloquea el event loop (proceso hijo asíncrono). */
async function runYtdlp(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(config.ytdlpPath, [...baseArgs(), ...args], {
    maxBuffer: 64 * 1024 * 1024, // las playlists grandes generan mucho JSON
    timeout: 60_000,
  });
  return stdout;
}

/** Convierte una entrada de yt-dlp en un `Track` reproducible. */
function toTrack(entry: YtdlpEntry): Track | null {
  if (!entry.id) return null;
  return {
    title: entry.title ?? "Desconocido",
    source: `https://www.youtube.com/watch?v=${entry.id}`,
    videoId: entry.id,
  };
}

/** ¿La cadena parece un enlace de YouTube? */
export function isYoutubeUrl(input: string): boolean {
  return input.includes("youtube.com") || input.includes("youtu.be");
}

/**
 * Resuelve un enlace de YouTube (vídeo suelto o playlist) a una lista de pistas.
 * Usa `--flat-playlist`, que solo lee metadatos (rápido) sin resolver cada vídeo.
 */
export async function resolveYoutubeUrl(
  url: string,
): Promise<{ tracks: Track[]; isPlaylist: boolean }> {
  const stdout = await runYtdlp(["--dump-single-json", "--flat-playlist", url]);
  const info = JSON.parse(stdout) as YtdlpResult;

  if (info.entries) {
    const tracks = info.entries.map((e) => (e ? toTrack(e) : null)).filter((t): t is Track => t !== null);
    return { tracks, isPlaylist: true };
  }

  const single = toTrack(info);
  return { tracks: single ? [single] : [], isPlaylist: false };
}

/**
 * Obtiene la URL directa del audio (la que se le pasa a FFmpeg) para una pista.
 * Se pide justo antes de reproducir porque estas URLs caducan.
 * Devuelve `null` si yt-dlp no encuentra nada.
 */
export async function getAudioStreamUrl(track: Track): Promise<string | null> {
  try {
    const stdout = await runYtdlp([
      "--format", "bestaudio[ext=m4a]/bestaudio/best",
      "--no-playlist",
      "--get-url",
      track.source,
    ]);
    return stdout.split("\n")[0]?.trim() || null;
  } catch (error) {
    console.error(`[youtube] No se pudo extraer el audio de "${track.title}":`, error);
    return null;
  }
}

/** Busca en YouTube y devuelve hasta `limit` resultados (solo metadatos). */
export async function searchYoutube(query: string, limit = 20): Promise<Track[]> {
  const stdout = await runYtdlp(["--dump-single-json", "--flat-playlist", `ytsearch${limit}:${query}`]);
  const info = JSON.parse(stdout) as YtdlpResult;
  return (info.entries ?? []).map((e) => (e ? toTrack(e) : null)).filter((t): t is Track => t !== null);
}
