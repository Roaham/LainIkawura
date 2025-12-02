import discord
from discord.ui import View, Button

class MusicControls(View):
    def __init__(self, vc, queue, next_callback):
        super().__init__(timeout=None)
        self.vc = vc
        self.queue = queue
        self.next_callback = next_callback

    @discord.ui.button(label="Play/Pause", style=discord.ButtonStyle.primary)
    async def play_pause(self, interaction: discord.Interaction, button: Button):
        if self.vc.is_playing():
            self.vc.pause()
            await interaction.response.send_message("Pausado", ephemeral=True)

        elif self.vc.is_paused():
            self.vc.resume()
            await interaction.response.send_message("Reanudado", ephemeral=True)

        else:
            await interaction.response.send_message("No hay nada sonando gilipollas", ephemeral=True)

    @discord.ui.button(label="Stop", style=discord.ButtonStyle.danger)
    async def stop(self, interaction: discord.Interaction, button: Button):
        if self.vc.is_playing() or self.vc.is_paused():
            self.vc.stop()
            self.queue.clear()
            await interaction.response.send_message("Stopping", ephemeral=True)
        else:
            await interaction.response.send_message("No hay nada sonando gilipollas", ephemeral=True)

    @discord.ui.button(label="Skip", style=discord.ButtonStyle.secondary)
    async def skip(self, interaction: discord.Interaction, button: Button):
        if self.vc.is_playing() or self.vc.is_paused():
            self.vc.stop()
            await interaction.response.send_message(ephemeral=True)
        else:
            await interaction.response.send_message("No hay música en reproducción.", ephemeral=True)
