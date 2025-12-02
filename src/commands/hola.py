from discord.ext import commands
from discord import app_commands

class Hola(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="hola", description="Te dice hola")
    async def hola(self, interaction):
        await interaction.response.send_message("…H-hola… …Tú… ¿sabes que estás… conectado?")

async def setup(bot):
    await bot.add_cog(Hola(bot))
