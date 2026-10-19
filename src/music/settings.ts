/**
 * Ajustes de música por servidor que deben sobrevivir aunque el bot se desconecte
 * del canal de voz (por ejemplo, activar el autoplay antes del primer /play).
 */
const autoplayGuilds = new Set<string>();

export function isAutoplayEnabled(guildId: string): boolean {
  return autoplayGuilds.has(guildId);
}

export function setAutoplay(guildId: string, enabled: boolean): void {
  if (enabled) autoplayGuilds.add(guildId);
  else autoplayGuilds.delete(guildId);
}
