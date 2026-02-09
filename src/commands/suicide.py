import discord
from discord.ext import commands
from discord import app_commands
import os

class Suicide(commands.Cog):
    def __init__ (self, bot):
        self.bot = bot
        # Calcula la ruta base de los assets dinámicamente
        # Asume que la estructura es: src/commands/suicide.py -> assets/ está en la raíz
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.assets_path = os.path.join(current_dir, "..", "..", "assets")

    @app_commands.command(name="suicide", description="Especifica de que forma quieres morir")
    @app_commands.describe(mode="Tipo de muerte")
    @app_commands.choices(
        mode = [
            app_commands.Choice(name="Tomate las pastillitas", value="pastidead"),
            app_commands.Choice(name="Vamos a beber :D", value="drinkdead"),
            app_commands.Choice(name="No te olvides de las drogas duras", value="cocadead"),
            app_commands.Choice(name="Cortate las venas", value="cutdead"),
            app_commands.Choice(name="Cuelgate de la lampara", value="lampdead"),
            app_commands.Choice(name="Tirate al rio", value="waterdead"),
            app_commands.Choice(name="Pegate un tiro", value="shotdead"),
            app_commands.Choice(name="Tirate por la ventana", value="dondecaemosgente"),
            app_commands.Choice(name="A por el coche wiii", value="cardead"),
            app_commands.Choice(name="Follate a Yuno", value="yunodead")
        ]
    )
    async def deadend(self, interaction: discord.Interaction, mode: app_commands.Choice[str]):
        
        def get_asset(filename):
            return os.path.join(self.assets_path, filename)

        # Verificación de seguridad por si la carpeta no existe en Railway
        if not os.path.exists(self.assets_path):
             return await interaction.response.send_message("❌ Error: No encuentro la carpeta de assets en el servidor.", ephemeral=True)

        if mode.value == "pastidead":
            resp = "se ha tomado las pastillas para dormir"
            img = discord.File(get_asset("pastis.jpg"), filename="pastis.jpg")
        elif mode.value == "drinkdead":
            resp = "se ha bebido todo el vodka que encontro"
            img = discord.File(get_asset("drinkdead.gif"), filename="drinkdead.gif")
        elif mode.value == "cocadead":
            resp = "ha esnifado por enciima de sus posibilidades"
            img = discord.File(get_asset("cocadead.gif"), filename="cocadead.gif")
        elif mode.value == "cutdead":
            resp = "se ha rajado todas las venas"
            img = discord.File(get_asset("venitas.jpg"), filename="venitas.jpg")
        elif mode.value == "lampdead":
            resp = "se colgo del techo"
            img = discord.File(get_asset("lampdead.jpg"), filename="lampdead.jpg")
        elif mode.value == "waterdead":
            resp = "se tiro al rio"
            img = discord.File(get_asset("waterdead.jpg"), filename="waterdead.jpg")
        elif mode.value == "shotdead":
            resp = "se voló la cabeza"
            img = discord.File(get_asset("shotdead.gif"), filename="shotdead.gif")
        elif mode.value == "dondecaemosgente":
            resp = "donde caemos gente?"
            img = discord.File(get_asset("chisa.gif"), filename="chisa.gif")
        elif mode.value == "cardead":
            resp = "se tiro a la carretera"
            img = discord.File(get_asset("truck-kun-truck.gif"), filename="truck-kun-truck.gif")
        elif mode.value == "yunodead":
            resp = "lo mato yuno (no debiste habertela follado yukiteru)"
            img = discord.File(get_asset("yuno.gif"), filename="yuno.gif")
        else:
            resp = "algo salio mal xd"
            img = None

        await interaction.response.send_message(f"{interaction.user.mention} {resp}",file=img)

async def setup(bot):
    await bot.add_cog(Suicide(bot))