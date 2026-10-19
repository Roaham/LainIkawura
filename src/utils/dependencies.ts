import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config";

const execFileAsync = promisify(execFile);

/** Comprueba que un programa externo está instalado; si no, aborta con una explicación clara. */
async function assertInstalled(binary: string, versionFlag: string, hint: string): Promise<void> {
  try {
    await execFileAsync(binary, [versionFlag]);
  } catch {
    throw new Error(`No encuentro "${binary}" en el sistema. ${hint}`);
  }
}

/** FFmpeg y yt-dlp no son paquetes de npm: hay que tenerlos instalados aparte. */
export async function checkExternalDependencies(): Promise<void> {
  await assertInstalled("ffmpeg", "-version", "Instala FFmpeg y añádelo al PATH.");
  await assertInstalled(config.ytdlpPath, "--version", "Instala yt-dlp o indica su ruta con YTDLP_PATH.");
}
