import discord
from discord.ext import commands
import yt_dlp
import asyncio
import random

class Autoplay(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.autoplay_enabled = {}
        self.last_played = {}
        self.monitors = {}
        self.locks = {}

    @discord.app_commands.command(name="autoplay", description="Activa o desactiva el autoplay")
    async def autoplay(self, interaction: discord.Interaction, enable: bool):
        self.autoplay_enabled[interaction.guild.id] = enable
        status = "activado" if enable else "desactivado"
        await interaction.response.send_message(f"Autoplay {status}")

        if enable and interaction.guild.id not in self.monitors:
            self.monitors[interaction.guild.id] = self.bot.loop.create_task(
                self.monitor_queue(interaction.guild, interaction.channel)
            )
        elif not enable and interaction.guild.id in self.monitors:
            self.monitors[interaction.guild.id].cancel()
            del self.monitors[interaction.guild.id]

    async def maybe_add_next(self, guild, text_channel):
        if not self.autoplay_enabled.get(guild.id, False):
            return

        if guild.id not in self.locks:
            self.locks[guild.id] = asyncio.Lock()

        async with self.locks[guild.id]:
            play_cog = self.bot.get_cog("Play")
            if not play_cog:
                return

            queue = play_cog.queues.get(guild.id)
            vc = guild.voice_client
            if not vc or not vc.is_connected():
                return

            if len(queue) <= 1:
                last = self.last_played.get(guild.id)
                if not last and queue:
                    last = queue[-1]
                if not last:
                    return

                related = await self.get_related(last)
                if related and (not queue or related['id'] != queue[-1].get('id')):
                    queue.append(related)
                    self.last_played[guild.id] = related
                    await text_channel.send(f"🎶Autoplay: **{related['title']}**")
                    if not vc.is_playing() and not vc.is_paused():
                        await play_cog.play_next(guild, text_channel)

    async def get_related(self, item):
        query = item.get("title")
        if not query:
            return None

        ydl_opts = {"quiet": True, "noplaylist": True, "extract_flat": True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch5:{query} similar", download=False)
                if "entries" in info and info["entries"]:
                    choices = [e for e in info["entries"] if e.get("id") != item.get("id")]
                    if choices:
                        selected = random.choice(choices)
                        return {"id": selected.get("id"), "title": selected.get("title")}
        except Exception as e:
            print(f"Error autoplay related: {e}")
            return None

    async def monitor_queue(self, guild, text_channel):
        while self.autoplay_enabled.get(guild.id, False):
            try:
                await self.maybe_add_next(guild, text_channel)
            except Exception as e:
                print(f"Error monitor_queue: {e}")
            await asyncio.sleep(5)

async def setup(bot):
    await bot.add_cog(Autoplay(bot))
