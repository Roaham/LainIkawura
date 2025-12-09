import discord
from discord.ext import commands
from discord import app_commands

class Util(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="avatar", description="Muestra el avatar de un usuario xd")
    @app_commands.describe(user="User")
    async def avatar(self, interaction: discord.Interaction, user: discord.Member = None):
        user = user or interaction.user

        embed = discord.Embed(
            title=f"Avatar de {user.display_name}",
            color=discord.Color.blurple()
        )
        embed.set_image(url=user.display_avatar.url)

        await interaction.response.send_message(embed=embed)

async def setup(bot):
    await bot.add_cog(Util(bot))
