import discord
from discord.ext import commands
from discord import app_commands
import yt_dlp
import asyncio
from music.controls import MusicControls

class Play(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.queues = {}

    async def get_playlist_items(self, url: str):
        """Devuelve solo títulos e IDs, no URLs completas."""
        ydl_opts = {
            "quiet": True,
            "noplaylist": False,
            "extract_flat": True,  # solo playlist
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # playlist
                if "entries" in info:
                    return [
                        {
                            "id": e.get("id"),
                            "title": e.get("title", "Desconocido")
                        }
                        for e in info["entries"]
                        if e is not None and e.get("id")
                    ]

                # video suelto
                return [{
                    "id": info.get("id"),
                    "title": info.get("title", "Desconocido")
                }]

        except Exception as e:
            print(f"Error obteniendo lista: {e}")
            return None

    async def get_audio_from_id(self, video_id: str):
        """Extrae solo cuando toca reproducir."""
        url = f"https://www.youtube.com/watch?v={video_id}"

        ydl_opts = {
            "format": "bestaudio/best",
            "quiet": True,
            "extractor_args": {"youtube": ["player_client=default"]},
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info['url']

        except Exception as e:
            print(f"Error extrayendo audio xd: {e}")
            return None

    async def play_next(self, guild, text_channel):
        queue = self.queues.get(guild.id)
        vc = guild.voice_client

        if not vc or not queue:
            return

        next_item = queue.pop(0)

        # obtener url
        audio_url = await self.get_audio_from_id(next_item["id"])
        if not audio_url:
            await text_channel.send(f"Error cargando: **{next_item['title']}**")
            return await self.play_next(guild, text_channel)

        def after(err):
            asyncio.run_coroutine_threadsafe(
                self.play_next(guild, text_channel),
                self.bot.loop
            )

        vc.play(
            discord.FFmpegOpusAudio(
                audio_url,
                before_options="-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
            ),
            after=after
        )

        await text_channel.send(f"🎶Reproduciendo: **{next_item['title']}**")

    @app_commands.command(name="play", description="Reproduce videos o playlists de YouTube")
    async def play(self, interaction: discord.Interaction, url: str):
        await interaction.response.defer()

        if interaction.user.voice is None:
            return await interaction.followup.send("Debes estar en un canal de voz.")

        guild = interaction.guild
        channel = interaction.user.voice.channel

        vc = guild.voice_client
        if vc is None:
            vc = await channel.connect()
        else:
            await vc.move_to(channel)

        # obtener items (solo IDs y títulos)
        items = await self.get_playlist_items(url)
        if not items:
            return await interaction.followup.send("No pude obtener información.")

        print("\n--- PLAYLIST CARGADA ---")
        for i, item in enumerate(items, 1):
            print(f"{i}. {item['title']} ({item['id']})")
        print("-------------------------\n")

        # crear cola si no existe
        if guild.id not in self.queues:
            self.queues[guild.id] = []

        # añadir videos pero no cargar URL
        self.queues[guild.id].extend(items)

        if not vc.is_playing() and not vc.is_paused():
            await self.play_next(guild, interaction.channel)

        view = MusicControls(
            vc,
            self.queues[guild.id],
            lambda: self.play_next(guild, interaction.channel)
        )

        await interaction.followup.send(
            f"Añadidos {len(items)} elemento(s) a la cola.",
            view=view
        )




async def setup(bot):
    await bot.add_cog(Play(bot))
