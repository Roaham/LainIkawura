import type { Command } from "../types";
import autoplay from "./autoplay";
import avatar from "./avatar";
import hola from "./hola";
import play from "./play";

/** Lista de comandos del bot. Para añadir uno nuevo: crea su archivo y añádelo aquí. */
export const commands: Command[] = [play, autoplay, avatar, hola];

/** Mismos comandos indexados por nombre, para despacharlos rápido al recibir una interacción. */
export const commandsByName = new Map(commands.map((c) => [c.data.name, c]));
