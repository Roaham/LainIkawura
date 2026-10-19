import { Client, GatewayIntentBits } from "discord.js";
import { banner } from "./banner";
import { config } from "./config";
import { registerInteractionHandler } from "./events/interactionCreate";
import { registerReadyHandler } from "./events/ready";
import { checkExternalDependencies } from "./utils/dependencies";

async function main(): Promise<void> {
  console.log(banner);
  await checkExternalDependencies();

  // Guilds: comandos slash. GuildVoiceStates: saber en qué canal de voz está cada usuario.
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

  registerReadyHandler(client);
  registerInteractionHandler(client);

  // Cierre limpio con Ctrl+C / señal de la plataforma de hosting.
  const shutdown = () => {
    console.log("Bot detenido.");
    void client.destroy().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
