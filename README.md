# Lain Ikawura Bot 🎧

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Discord](https://img.shields.io/badge/Discord-Bot-green)

**Lain Ikawura Bot** es un bot de Discord en español, diseñado para servidores personales, con un enfoque principal en la reproducción de música y utilidades personalizadas.

---

## ✨ Funcionalidades

* **YouTube:** Reproducción de audio mediante enlaces o búsqueda directa.
* **Spotify:** Soporte para lectura de playlists y canciones.
* **Comandos Slash:** Integración moderna con comandos de barra diagonal (`/`).
* **Especializado:** Optimizado para un server personal (ej. `/play`, `/suicide`).

---

## 🛠️ 1. Instalación de Librerías

El bot depende de tres librerías externas fundamentales. Puedes instalarlas todas juntas con el siguiente comando:

```bash
pip install -U discord.py yt-dlp spotipy
```

## 2. Configuración de FFmpeg (Requisito de Sistema)
FFmpeg no es una librería de Python, es el motor de audio que usa el sistema para transmitir voz. Sin esto, el bot se unirá al canal pero no sonará nada.

Descarga: Ve a la web oficial de FFmpeg y descarga los binarios para tu sistema operativo.

Carpeta Bin: Extrae el contenido y localiza la carpeta llamada bin (donde verás el archivo ffmpeg.exe).

Variables de Entorno:

Busca "Editar las variables de entorno del sistema" en tu Windows.

En "Variables de entorno", busca la variable Path y selecciona "Editar".

Añade la ruta completa de la carpeta bin que localizaste anteriormente.

## 3. Configuración de Cookies
Para evitar que YouTube bloquee al bot con errores 429 Too Many Requests, se recomienda usar tus propias cookies:

Instala la extensión "Get cookies.txt LOCALLY" en Chrome o Firefox.

Entra en YouTube con tu cuenta iniciada.

Usa la extensión para descargar el archivo de cookies.

Renombra el archivo a cookies.txt y pégalo en la raíz de la carpeta del bot (donde está bot.py).

## 4. Cómo Iniciar el Bot
Sigue este orden exacto para poner el bot en marcha:

Encendido: Ejecuta el bot desde la terminal:

```bash
python bot.py
```

Verificación: En la consola debe aparecer: Bot conectado como [LainIkawura].

⚠️ Importante: Asegúrate de que tu bot tiene los Intents de voz y mensajes activados en el Discord Developer Portal.