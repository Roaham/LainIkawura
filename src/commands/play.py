import discord
from discord.ext import commands
from discord import app_commands
from src.music.controls import MusicControls
import yt_dlp
import asyncio
import os
import shutil
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

class Play(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.queues = {}
        self.loop_enabled = {}

        client_id = os.getenv("SPOTIPY_CLIENT_ID")
        client_secret = os.getenv("SPOTIPY_CLIENT_SECRET")

        self.sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        ))

        self.ydlopts = {
            "format": "bestaudio[ext=m4a]/bestaudio/best",
            "quiet": True,
            "nocheckcertificate": True,
            "ignoreerrors": True,
            "default_search": "auto",
            "source_address": "0.0.0.0",
            "noplaylist": True,
            # Opciones para evitar errores 403 de YouTube
            "http_headers": {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        }

        # Soporte para cookies.txt (Solución Punto 1)
        if os.path.exists("cookies.txt"):
            self.ydlopts["cookiefile"] = "cookies.txt"

    async def get_audio_from_item(self, item):
        try:
            with yt_dlp.YoutubeDL(self.ydlopts) as ydl:
                if "id" in item:
                    url = f"https://www.youtube.com/watch?v={item['id']}"
                else:
                    url = item.get("url")

                info = ydl.extract_info(url, download=False)
                if "entries" in info:
                    return info["entries"][0]["url"]
                return info["url"]
        except Exception as e:
            print(f"Error extrayendo el audio: {e}")
            return None

    async def play_next(self, guild, text_channel):
        queue = self.queues.get(guild.id)
        vc = guild.voice_client

        if not vc or not queue:
            return

        # Bucle para encontrar una canción válida (Solución Punto 4 - Recursividad)
        audio_url = None
        next_item = None
        
        while queue:
            next_item = queue[0]
            audio_url = await self.get_audio_from_item(next_item)
            if audio_url:
                break
            else:
                await text_channel.send(f"⚠️ No he podido cargar: **{next_item.get('title','Desconocido')}**. Saltando...")
                queue.pop(0)
        
        if not audio_url or not next_item:
            return

        def after(err):
            if self.loop_enabled.get(guild.id, False):
                queue.append(next_item)
            queue.pop(0)

            asyncio.run_coroutine_threadsafe(self.play_next(guild, text_channel), self.bot.loop)

            autoplay_cog = self.bot.get_cog("Autoplay")
            if autoplay_cog and autoplay_cog.autoplay_enabled.get(guild.id, False):
                asyncio.run_coroutine_threadsafe(
                    autoplay_cog.maybe_add_next(guild, text_channel),
                    self.bot.loop
                )

        before_args = "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5"
        ffmpeg_args = "-vn -filter:a 'volume=1.0' -b:a 192k"

        try:
            vc.play(
                discord.FFmpegOpusAudio(
                    audio_url,
                    before_options=before_args,
                    options=ffmpeg_args
                ),
                after=after
            )
        except Exception as e:
            print(f"Error al iniciar FFmpeg: {e}")
            queue.pop(0)
            await self.play_next(guild, text_channel)
            asyncio.run_coroutine_threadsafe(self.play_next(guild, text_channel), self.bot.loop)
            return

        autoplay_cog = self.bot.get_cog("Autoplay")
        if autoplay_cog:
            autoplay_cog.last_played[guild.id] = next_item

        await text_channel.send(f"🎶Reproduciendo: **{next_item['title']}**")

    @app_commands.command(name="play", description="Reproduce música de YouTube o Spotify")
    async def play(self, interaction: discord.Interaction, url: str):
        await interaction.response.defer()

        # Verificación de FFmpeg (Solución Punto 2)
        if not shutil.which("ffmpeg"):
            return await interaction.followup.send("❌ Error crítico: **FFmpeg** no está instalado o no se encuentra en el PATH del sistema.")

        if interaction.user.voice is None:
            return await interaction.followup.send("Humano... Entra al canal.")

        guild = interaction.guild
        channel = interaction.user.voice.channel

        vc = guild.voice_client
        if vc is None:
            try:
                vc = await channel.connect(self_deaf=True)
            except Exception as e:
                return await interaction.followup.send(f"No pude entrar al canal: {e}")
        else:
            await vc.move_to(channel)

        items = []
        is_playlist = False

        if "youtube.com" in url or "youtu.be" in url:
            ydl_opts = {
                "quiet": True,
                "noplaylist": False,
                "extract_flat": True
            }

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)

                    if "entries" in info:
                        is_playlist = True
                        for e in info["entries"]:
                            if e is not None:
                                items.append({
                                    "id": e.get("id"),
                                    "title": e.get("title", "Desconocido")
                                })
                    else:
                        items.append({
                            "id": info.get("id"),
                            "title": info.get("title", "Desconocido")
                        })
            except Exception as e:
                return await interaction.followup.send(f"No hay nada asi en la Wired, no me hagas perder el tiempo... {e}")

        elif "spotify.com" in url:
            if "track" in url:
                track = self.sp.track(url)
                # Mejor búsqueda para evitar covers (Solución Punto 3)
                query = f"{track['name']} {track['artists'][0]['name']} audio"
                items.append({
                    "title": track['name'],
                    "url": f"ytsearch:{query}"
                })

            elif "playlist" in url:
                is_playlist = True
                pl = self.sp.playlist(url)
                for t in pl['tracks']['items']:
                    track = t["track"]
                    query = f"{track['name']} {track['artists'][0]['name']} audio"
                    items.append({
                        "title": track["name"],
                        "url": f"ytsearch:{query}"
                    })

            else:
                return await interaction.followup.send("URL de Spotify inválida.")

        else:
            return await interaction.followup.send("Solo acepto URLs de YouTube o Spotify.")

        if guild.id not in self.queues:
            self.queues[guild.id] = []
        if guild.id not in self.loop_enabled:
            self.loop_enabled[guild.id] = False

        self.queues[guild.id].extend(items)

        if not vc.is_playing() and not vc.is_paused():
            await self.play_next(guild, interaction.channel)

        view = MusicControls(
            vc,
            self.queues[guild.id],
            lambda: self.play_next(guild, interaction.channel),
            self.loop_enabled,
            guild.id,
            show_loop=not is_playlist
        )

        await interaction.followup.send(
            f"Añadidos {len(items)} elemento(s) a la cola.",
            view=view
        )

async def setup(bot):
    await bot.add_cog(Play(bot))
