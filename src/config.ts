import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";

/** Lee una variable de entorno obligatoria o aborta con un mensaje claro. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name} (revisa tu .env).`);
  return value;
}

const cookiesPath = path.resolve(process.env.COOKIES_PATH ?? "cookies.txt");

/** Configuración central del bot, cargada una sola vez desde el entorno. */
export const config = {
  discordToken: required("DISCORD_TOKEN"),
  /** Solo lo necesita el script de registro de comandos. */
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  /** Opcional: sin estas credenciales el bot funciona, pero solo con YouTube. */
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  },
  /** Binario de yt-dlp (debe estar en el PATH o indicarse con YTDLP_PATH). */
  ytdlpPath: process.env.YTDLP_PATH ?? "yt-dlp",
  /** Cookies de YouTube para evitar bloqueos 429. Solo se usan si el archivo existe. */
  cookiesPath: existsSync(cookiesPath) ? cookiesPath : null,
} as const;
