import { REST, Routes } from "discord.js";
import { commands } from "./commands";
import { config } from "./config";

/**
 * Registra los comandos slash en Discord (equivale al antiguo `!sync`).
 * Ejecútalo con `npm run deploy` cuando añadas o cambies comandos, NO en cada arranque
 * (Discord limita cuántas veces se pueden registrar).
 */
async function deploy(): Promise<void> {
  if (!config.clientId) throw new Error("Falta DISCORD_CLIENT_ID en el .env.");

  const rest = new REST().setToken(config.discordToken);
  const body = commands.map((c) => c.data.toJSON());

  // Con DISCORD_GUILD_ID los comandos aparecen al instante en ese servidor; sin él son globales (tardan un rato).
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  const registered = (await rest.put(route, { body })) as unknown[];
  console.log(`Registrados ${registered.length} comandos (${config.guildId ? "servidor" : "globales"}).`);
}

deploy().catch((error) => {
  console.error(error);
  process.exit(1);
});
