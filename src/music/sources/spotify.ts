import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { config } from "../../config";
import type { Track } from "../../types";

/** ¿Hay credenciales de Spotify configuradas? */
export const isSpotifyConfigured = Boolean(config.spotify.clientId && config.spotify.clientSecret);

let client: SpotifyApi | null = null;

/** Crea el cliente de Spotify la primera vez que se necesita. */
function getClient(): SpotifyApi {
  if (!isSpotifyConfigured) throw new Error("Spotify no está configurado.");
  client ??= SpotifyApi.withClientCredentials(config.spotify.clientId!, config.spotify.clientSecret!);
  return client;
}

/** ¿La cadena parece un enlace de Spotify? */
export function isSpotifyUrl(input: string): boolean {
  return input.includes("spotify.com");
}

/** Extrae el ID de un enlace tipo `https://open.spotify.com/track/<ID>?si=...`. */
function extractId(url: string, kind: "track" | "playlist"): string | null {
  return new RegExp(`/${kind}/([A-Za-z0-9]+)`).exec(url)?.[1] ?? null;
}

/**
 * Spotify no permite reproducir audio, así que cada canción se convierte en una
 * búsqueda de YouTube ("<título> <artista> audio") que se resuelve al reproducirla.
 */
function toTrack(name: string, artist: string | undefined): Track {
  return { title: name, source: `ytsearch1:${name} ${artist ?? ""} audio`.trim() };
}

/**
 * Resuelve un enlace de Spotify (canción o playlist) a una lista de pistas.
 * Lanza un error con mensaje legible si el enlace no es válido.
 */
export async function resolveSpotifyUrl(url: string): Promise<{ tracks: Track[]; isPlaylist: boolean }> {
  if (url.includes("/track/")) {
    const id = extractId(url, "track");
    if (!id) throw new Error("URL de Spotify inválida.");
    const track = await getClient().tracks.get(id);
    return { tracks: [toTrack(track.name, track.artists[0]?.name)], isPlaylist: false };
  }

  if (url.includes("/playlist/")) {
    const id = extractId(url, "playlist");
    if (!id) throw new Error("URL de Spotify inválida.");
    const playlist = await getClient().playlists.getPlaylist(id);
    const tracks = playlist.tracks.items
      .map((item) => item.track)
      // Las playlists pueden incluir podcasts (sin artists); nos quedamos solo con canciones.
      .filter((t): t is NonNullable<typeof t> & { artists: { name: string }[] } => !!t && "artists" in t)
      .map((t) => toTrack(t.name, t.artists[0]?.name));
    return { tracks, isPlaylist: true };
  }

  throw new Error("URL de Spotify inválida.");
}
