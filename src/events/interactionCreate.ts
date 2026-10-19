import { Events, MessageFlags, type Client, type Interaction } from "discord.js";
import { commandsByName } from "../commands";
import { MUSIC_BUTTON_PREFIX, handleMusicButton } from "../music/controls";

/** Avisa al usuario de que algo falló, sin que el propio aviso pueda romper el bot. */
async function replyWithError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) return;
  const content = "Algo ha fallado ejecutando eso. Inténtalo de nuevo.";
  try {
    if (interaction.deferred || interaction.replied) await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error("[interaction] No se pudo avisar del error:", error);
  }
}

/** Enruta comandos slash y botones de música al código que los maneja. */
export function registerInteractionHandler(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await commandsByName.get(interaction.commandName)?.execute(interaction);
      } else if (interaction.isButton() && interaction.customId.startsWith(MUSIC_BUTTON_PREFIX)) {
        await handleMusicButton(interaction);
      }
    } catch (error) {
      console.error("[interaction] Error no controlado:", error);
      await replyWithError(interaction);
    }
  });
}
