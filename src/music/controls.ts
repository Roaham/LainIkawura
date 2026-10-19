import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, type ButtonInteraction } from "discord.js";
import { playerManager } from "./PlayerManager";

/** Prefijo de los customId de los botones, para distinguirlos de otros posibles botones. */
export const MUSIC_BUTTON_PREFIX = "music:";

type MusicAction = "pause" | "stop" | "skip" | "loop";

/**
 * Construye la botonera de control de música.
 * El botón de bucle se oculta en playlists (`showLoop = false`).
 */
export function buildControls(showLoop = true): ActionRowBuilder<ButtonBuilder> {
  const button = (action: MusicAction, label: string, style: ButtonStyle) =>
    new ButtonBuilder().setCustomId(`${MUSIC_BUTTON_PREFIX}${action}`).setLabel(label).setStyle(style);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    button("pause", "Play/Pause", ButtonStyle.Primary),
    button("stop", "Stop", ButtonStyle.Danger),
    button("skip", "Skip", ButtonStyle.Secondary),
  );
  if (showLoop) row.addComponents(button("loop", "Loop", ButtonStyle.Success));
  return row;
}

/** Responde de forma privada (solo la ve quien pulsó el botón). */
const reply = (interaction: ButtonInteraction, content: string) =>
  interaction.reply({ content, flags: MessageFlags.Ephemeral });

/** Ejecuta la acción asociada al botón pulsado sobre el reproductor del servidor. */
export async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  const action = interaction.customId.slice(MUSIC_BUTTON_PREFIX.length) as MusicAction;
  const player = interaction.guildId ? playerManager.get(interaction.guildId) : undefined;

  if (!player) {
    await reply(interaction, "No hay nada sonando.");
    return;
  }

  switch (action) {
    case "pause": {
      const result = player.togglePause();
      await reply(interaction, result === "paused" ? "⏸️ Pausado." : result === "resumed" ? "▶️ Reanudado." : "No hay nada sonando.");
      break;
    }
    case "stop":
      await reply(interaction, player.stop() ? "⏹️ Detenido y cola vaciada." : "No hay nada sonando.");
      break;
    case "skip":
      await reply(interaction, player.skip() ? "⏭️ Canción saltada." : "No hay nada que saltar.");
      break;
    case "loop":
      await reply(interaction, player.toggleLoop() ? "🔁 Bucle activado." : "Bucle desactivado.");
      break;
  }
}
