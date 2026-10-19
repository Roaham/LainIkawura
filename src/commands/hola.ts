import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";

const hola: Command = {
  data: new SlashCommandBuilder().setName("hola").setDescription("Te dice hola"),

  async execute(interaction) {
    await interaction.reply("…H-hola… …Tú… ¿sabes que estás… conectado?");
  },
};

export default hola;
