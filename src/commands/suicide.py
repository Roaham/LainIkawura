import discord
from discord.ext import commands
from discord import app_commands

class Suicide(commands.Cog):
    def __init__ (self, bot):
        self.bot = bot

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
        if mode.value == "pastidead":
            resp = "se ha tomado las pastillas para dormir"
            img = discord.File("./assets/pastis.jpg", filename="pastis.jpg")
        elif mode.value == "drinkdead":
            resp = "se ha bebido todo el vodka que encontro"
            img = discord.File("./assets/drinkdead.gif", filename="drinkdead.gif")
        elif mode.value == "cocadead":
            resp = "ha esnifado por enciima de sus posibilidades"
            img = discord.File("./assets/cocadead.gif", filename="cocadead.gif")
        elif mode.value == "cutdead":
            resp = "se ha rajado todas las venas"
            img = discord.File("./assets/venitas.jpg", filename="venitas.jpg")
        elif mode.value == "lampdead":
            resp = "se colgo del techo"
            img = discord.File("./assets/lampdead.jpg", filename="lampdead.jpg")
        elif mode.value == "waterdead":
            resp = "se tiro al rio"
            img = discord.File("./assets/waterdead.jpg", filename="waterdead.jpg")
        elif mode.value == "shotdead":
            resp = "se voló la cabeza"
            img = discord.File("./assets/shotdead.gif", filename="shotdead.gif")
        elif mode.value == "dondecaemosgente":
            resp = "donde caemos gente?"
            img = discord.File("./assets/chisa.gif", filename="chisa.gif")
        elif mode.value == "cardead":
            resp = "se tiro a la carretera"
            img = discord.File("./assets/truck-kun-truck.gif", filename="truck-kun-truck.gif")
        elif mode.value == "yunodead":
            resp = "lo mato yuno (no debiste habertela follado yukiteru)"
            img = discord.File("./assets/yuno.gif", filename="yuno.gif")
        else:
            resp = "algo salio mal xd"

        await interaction.response.send_message(f"{interaction.user.mention} {resp}",file=img)

async def setup(bot):
    await bot.add_cog(Suicide(bot))