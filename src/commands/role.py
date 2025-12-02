from discord.ext import commands
from discord import app_commands
import discord

class Role(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="role", description="Dependiendo del rol que seas hace algo")
    async def role(self, interaction: discord.Interaction, member: discord.Member = None):
        member = member or interaction.user

        role_names = [role.name for role in member.roles]

        if "Presidente" in role_names:
            await interaction.response.send_message(
                f"{member.mention} es mi padre, estoy muy unida con nuestro señor presidente, gracias al cielo que tenemos a alguien sobrecualificado..."
            )
        elif "Ministro" in role_names:
            await interaction.response.send_message(
                f"{member.mention} es el ministro de esta grandiosa comunidad de 2 personas, menudo pajero"
            )
        elif "Ciudadano" in role_names:
            await interaction.response.send_message(
                f"{member.mention} son el pueblo llano, los putos muggels"
            )
        elif "Esclavo" in role_names:
            await interaction.response.send_message(
                f"{member.mention} ya mejoderia ser como tu, PUAJAJAJA"
            )
        else:
            await interaction.response.send_message(f"{member.mention} eres literalmente nadie")

async def setup(bot):
    await bot.add_cog(Role(bot))
