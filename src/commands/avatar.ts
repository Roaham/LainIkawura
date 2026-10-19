import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";

const avatar: Command = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar de un usuario")
    .addUserOption((o) => o.setName("user").setDescription("Usuario (por defecto, tú)")),

  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = interaction.options.getMember("user") ?? interaction.member;

    // Si es miembro del servidor se muestra su avatar de servidor (si lo tiene) y su apodo.
    const displayName = member && "displayName" in member ? member.displayName : user.displayName;
    const avatarUrl = member && "displayAvatarURL" in member ? member.displayAvatarURL({ size: 1024 }) : user.displayAvatarURL({ size: 1024 });

    const embed = new EmbedBuilder().setTitle(`Avatar de ${displayName}`).setColor(0x5865f2).setImage(avatarUrl);
    await interaction.reply({ embeds: [embed] });
  },
};

export default avatar;
