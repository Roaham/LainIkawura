# Lain Ikawura Bot 🎧

![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Node](https://img.shields.io/badge/Node-22+-green)
![Discord](https://img.shields.io/badge/Discord-Bot-5865F2)

Bot de Discord en español para reproducir música de **YouTube** y **Spotify** en servidores personales. Reescrito en TypeScript con [discord.js](https://discord.js.org) y [@discordjs/voice](https://github.com/discordjs/voice).

## Comandos

| Comando | Qué hace |
|---|---|
| `/play <url>` | Reproduce un vídeo o playlist de YouTube, o una canción/playlist de Spotify |
| `/autoplay <true/false>` | Cuando se acaba la cola, añade canciones relacionadas automáticamente |
| `/avatar [usuario]` | Muestra el avatar de un usuario |
| `/hola` | Saluda |

Los mensajes de `/play` incluyen botones: **Play/Pause**, **Stop**, **Skip** y **Loop** (el bucle no aparece en playlists).

## Requisitos

- **Node.js 22.12+**
- **FFmpeg** en el PATH (motor de audio)
- **yt-dlp** en el PATH (o ruta en `YTDLP_PATH`)
- Credenciales de [Spotify for Developers](https://developer.spotify.com/dashboard) (Client ID y Secret)
- Un bot creado en el [Discord Developer Portal](https://discord.com/developers/applications)

## Puesta en marcha

```bash
npm install
cp .env.example .env     # rellena token y credenciales
npm run deploy           # registra los comandos slash (solo al añadir/cambiar comandos)
npm run dev              # desarrollo con recarga
# o, para producción:
npm run build && npm start
```

**Cookies de YouTube (opcional):** si YouTube devuelve errores 429, exporta tus cookies con una extensión tipo *Get cookies.txt LOCALLY*, guárdalas como `cookies.txt` en la raíz y el bot las usará solo.

## Arquitectura

```
src/
├── index.ts               Arranque: comprueba FFmpeg/yt-dlp, crea el cliente y conecta eventos
├── config.ts              Lee y valida las variables de entorno
├── types.ts               Tipos compartidos: Track y Command
├── deploy-commands.ts     Registra los comandos slash en Discord (sustituye al antiguo !sync)
├── commands/              Un archivo por comando slash + index.ts con la lista
├── events/                interactionCreate (enruta comandos/botones) y ready
└── music/
    ├── GuildPlayer.ts     Reproductor de un servidor: cola, bucle, autoplay, FFmpeg
    ├── PlayerManager.ts   Un GuildPlayer por servidor + unión al canal de voz
    ├── controls.ts        Botones (Play/Pause, Stop, Skip, Loop) y su lógica
    ├── autoplay.ts        Busca una canción relacionada
    ├── settings.ts        Autoplay activado por servidor
    └── sources/
        ├── youtube.ts     Llama a yt-dlp: resolver enlaces, URL de audio, búsquedas
        └── spotify.ts     Convierte canciones de Spotify en búsquedas de YouTube
```

### Cómo fluye una canción

1. `/play` resuelve el enlace a una lista de `Track` (`sources/`), entra al canal de voz (`PlayerManager.connect`) y llama a `GuildPlayer.enqueue`.
2. `GuildPlayer.playNext` toma la siguiente pista, pide a yt-dlp la URL directa del audio (caduca, por eso se pide justo antes de sonar) y lanza FFmpeg.
3. Al terminar, el reproductor emite *Idle* → `handleTrackEnd` aplica el bucle y avanza. Si la cola está vacía y el autoplay está activo, `addRelatedTrack` busca otra canción.

### Métodos principales de `GuildPlayer`

| Método | Función |
|---|---|
| `enqueue(tracks)` | Añade pistas a la cola; arranca si no sonaba nada |
| `togglePause()` | Pausa/reanuda |
| `skip()` | Salta a la siguiente |
| `stop()` | Para y vacía la cola |
| `toggleLoop()` | Activa/desactiva el bucle |
| `onAutoplayEnabled()` | Hace que el autoplay actúe en el momento de activarse |
| `destroy()` | Limpia todo y sale del canal |
| `playNext()` *(privado)* | Busca la siguiente pista válida, saltando las que fallan |
| `handleTrackEnd()` *(privado)* | Qué hacer cuando acaba una pista |
| `addRelatedTrack()` *(privado)* | Autoplay: añade una canción relacionada sin lanzar búsquedas duplicadas |
| `handleDisconnect()` *(privado)* | Intenta reconectar tras una desconexión; si no, se cierra |

La verdad que claude ha refactorizado todas mis funciones anteriores, ademas de actualizar y mejorar muchas de ellas, madre mia
