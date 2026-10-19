import { Events, type Client } from "discord.js";

export function registerReadyHandler(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Bot conectado como ${readyClient.user.tag}`);
  });
}
