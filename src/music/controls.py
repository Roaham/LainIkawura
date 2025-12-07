import discord
from discord.ui import View, Button

class MusicControls(View):
    def __init__(self, vc, queue, next_callback, loop_enabled, guild_id, show_loop=True):
        super().__init__(timeout=None)
        self.vc = vc
        self.queue = queue
        self.next_callback = next_callback
        self.loop_enabled = loop_enabled
        self.guild_id = guild_id

        if not show_loop:
            for child in self.children:
                if child.label == "Loop":
                    self.remove_item(child)
                    break

    @discord.ui.button(label="Play/Pause", style=discord.ButtonStyle.primary)
    async def play_pause(self, interaction: discord.Interaction, button: Button):
        await interaction.response.edit_message(view=self)

        if self.vc.is_playing():
            self.vc.pause()
            await interaction.followup.send("Pausating.", ephemeral=True)

        elif self.vc.is_paused():
            self.vc.resume()
            await interaction.followup.send("Reanudating.", ephemeral=True)

        else:
            await interaction.followup.send("No hay nada sonando gilipollas", ephemeral=True)

    @discord.ui.button(label="Stop", style=discord.ButtonStyle.danger)
    async def stop(self, interaction: discord.Interaction, button: Button):
        await interaction.response.edit_message(view=self)

        if self.vc.is_playing() or self.vc.is_paused():
            self.vc.stop()
            self.queue.clear()
            await interaction.followup.send("Detenido.", ephemeral=True)
        else:
            await interaction.followup.send("No hay nada sonando gilipollas", ephemeral=True)

    @discord.ui.button(label="Skip", style=discord.ButtonStyle.secondary)
    async def skip(self, interaction: discord.Interaction, button: Button):
        await interaction.response.edit_message(view=self)

        if self.vc.is_playing() or self.vc.is_paused():
            self.vc.stop()
            await interaction.followup.send(ephemeral=True)
        else:
            await interaction.followup.send("Que me salto? tu pija?", ephemeral=True)

    @discord.ui.button(label="Loop", style=discord.ButtonStyle.success)
    async def loop(self, interaction: discord.Interaction, button: Button):
        await interaction.response.edit_message(view=self)

        current = self.loop_enabled.get(self.guild_id, False)
        self.loop_enabled[self.guild_id] = not current

        estado = "activo" if not current else "inactivo"
        await interaction.followup.send(f"Bucle {estado}.", ephemeral=True)
