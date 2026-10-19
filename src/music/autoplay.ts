import type { Track } from "../types";
import { searchYoutube } from "./sources/youtube";

/** Sufijos que se añaden al título para que las recomendaciones no sean siempre las mismas. */
const QUERY_VARIANTS = ["", " remix", " cover", " live", " genre"];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/**
 * Busca en YouTube una canción "parecida" a `seed` para el autoplay.
 * Descarta la propia canción y las ya sonadas recientemente (`recentIds`).
 * Devuelve `null` si no hay candidatas o la búsqueda falla.
 */
export async function findRelatedTrack(seed: Track, recentIds: readonly string[]): Promise<Track | null> {
  try {
    const results = await searchYoutube(`${seed.title}${pickRandom(QUERY_VARIANTS)}`, 20);
    const candidates = results.filter(
      (t) => t.videoId && t.videoId !== seed.videoId && !recentIds.includes(t.videoId),
    );
    return candidates.length > 0 ? pickRandom(candidates) : null;
  } catch (error) {
    console.error("[autoplay] Error buscando canciones relacionadas:", error);
    return null;
  }
}
