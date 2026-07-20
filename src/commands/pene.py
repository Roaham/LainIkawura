from discord.ext import commands
from discord import app_commands
import discord

class Pene(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="pene", description="adivina")
    async def pene(self, interaction):
        await interaction.response.send_message(f"Hola! {interaction.user.mention} esta funcion esta desabilitada temporalmente en funcion de ser mas normalito, disculpe las molestias")

async def setup(bot):
    await bot.add_cog(Pene(bot))

