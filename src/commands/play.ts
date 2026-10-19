import { SlashCommandBuilder } from "discord.js";
import { buildControls } from "../music/controls";
import { playerManager } from "../music/PlayerManager";
import { isSpotifyConfigured, isSpotifyUrl, resolveSpotifyUrl } from "../music/sources/spotify";
import { isYoutubeUrl, resolveYoutubeUrl } from "../music/sources/youtube";
import type { Command, Track } from "../types";

/** Convierte el enlace recibido en pistas, según sea de YouTube o de Spotify. */
async function resolveInput(url: string): Promise<{ tracks: Track[]; isPlaylist: boolean } | null> {
  if (isYoutubeUrl(url)) return resolveYoutubeUrl(url);
  if (isSpotifyUrl(url)) return resolveSpotifyUrl(url);
  return null;
}

const play: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduce música de YouTube o Spotify")
    .addStringOption((o) => o.setName("url").setDescription("Enlace de YouTube o Spotify").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    if (!interaction.inCachedGuild()) {
      await interaction.editReply("Este comando solo funciona en servidores.");
      return;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.editReply("Humano... Entra al canal.");
      return;
    }

    // 1) Resolver el enlace ANTES de entrar al canal: si falla, el bot no se queda conectado en vano.
    const url = interaction.options.getString("url", true);
    if (isSpotifyUrl(url) && !isSpotifyConfigured) {
      await interaction.editReply("Spotify no está configurado en este bot. Usa un enlace de YouTube.");
      return;
    }
    let resolved: Awaited<ReturnType<typeof resolveInput>>;
    try {
      resolved = await resolveInput(url);
    } catch (error) {
      console.error("[play] Error resolviendo el enlace:", error);
      await interaction.editReply("No hay nada así en la Wired, no me hagas perder el tiempo...");
      return;
    }

    if (!resolved) {
      await interaction.editReply("Solo acepto URLs de YouTube o Spotify.");
      return;
    }
    if (resolved.tracks.length === 0) {
      await interaction.editReply("No he encontrado ninguna canción en ese enlace.");
      return;
    }

    // 2) Entrar (o moverse) al canal de voz del usuario.
    let player;
    try {
      player = await playerManager.connect(interaction.guild, voiceChannel, interaction.channel);
    } catch (error) {
      await interaction.editReply(error instanceof Error ? error.message : "No pude entrar al canal.");
      return;
    }

    // 3) Encolar (empieza a sonar solo si estaba parado) y responder con los controles.
    player.enqueue(resolved.tracks);
    await interaction.editReply({
      content: `Añadidos ${resolved.tracks.length} elemento(s) a la cola.`,
      components: [buildControls(!resolved.isPlaylist)],
    });
  },
};

export default play;
