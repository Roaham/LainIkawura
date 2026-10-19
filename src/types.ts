import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

/**
 * Una canción de la cola.
 * `source` es lo que yt-dlp sabe resolver: una URL de YouTube o una búsqueda `ytsearch1:...`
 * (así las canciones de Spotify se buscan en YouTube justo antes de reproducirse).
 */
export interface Track {
  title: string;
  source: string;
  /** ID de vídeo de YouTube, si se conoce. Se usa para no repetir canciones en el autoplay. */
  videoId?: string;
}

/** Contrato que cumple cada comando slash. */
export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
