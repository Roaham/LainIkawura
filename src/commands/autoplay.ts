import { SlashCommandBuilder } from "discord.js";
import { playerManager } from "../music/PlayerManager";
import { setAutoplay } from "../music/settings";
import type { Command } from "../types";

const autoplay: Command = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Activa o desactiva el autoplay")
    .addBooleanOption((o) => o.setName("enable").setDescription("Activar (true) o desactivar (false)").setRequired(true)),

  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply("Este comando solo funciona en servidores.");
      return;
    }

    const enable = interaction.options.getBoolean("enable", true);
    setAutoplay(interaction.guildId, enable);
    await interaction.reply(`Autoplay ${enable ? "activado" : "desactivado"}`);

    if (enable) playerManager.get(interaction.guildId)?.onAutoplayEnabled();
  },
};

export default autoplay;
