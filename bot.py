import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
import asyncio
from pathlib import Path
from src.token_me import token_me;

banner = r""" 
 /$$                 /$$                                               
| $$                |__/                                               
| $$        /$$$$$$  /$$ /$$$$$$$                                      
| $$       |____  $$| $$| $$__  $$                                     
| $$        /$$$$$$$| $$| $$  \ $$                                     
| $$       /$$__  $$| $$| $$  | $$                                     
| $$$$$$$$|  $$$$$$$| $$| $$  | $$                                     
|________/ \_______/|__/|__/  |__/                                                                                                    
                                                                       
 /$$$$$$                         /$$                                   
|_  $$_/                        | $$                                   
  | $$   /$$  /$$  /$$  /$$$$$$ | $$   /$$ /$$   /$$  /$$$$$$  /$$$$$$ 
  | $$  | $$ | $$ | $$ |____  $$| $$  /$$/| $$  | $$ /$$__  $$|____  $$
  | $$  | $$ | $$ | $$  /$$$$$$$| $$$$$$/ | $$  | $$| $$  \__/ /$$$$$$$
  | $$  | $$ | $$ | $$ /$$__  $$| $$_  $$ | $$  | $$| $$      /$$__  $$
 /$$$$$$|  $$$$$/$$$$/|  $$$$$$$| $$ \  $$|  $$$$$$/| $$     |  $$$$$$$
|______/ \_____/\___/  \_______/|__/  \__/ \______/ |__/      \_______/
made by RoaHam
"""
print(banner)

TOKEN = token_me

if not TOKEN:
    raise ValueError("No se ha encontrado el DISCORD_TOKEN en las variables de entorno.")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.command(name="sync")
async def sync(ctx):
    """Sincroniza los comandos manualmente para evitar Rate Limits."""
    if ctx.author.id != 304630666666666666: # Opcional: Pon tu ID aquí para seguridad
        pass # O quita el if si es un bot privado
    
    print("Sincronizando comandos...")
    synced = await bot.tree.sync()
    await ctx.send(f"Sincronizados {len(synced)} comandos.")
    print(f"Comandos sincronizados: {len(synced)}")

@bot.event
async def on_ready():
    print(f"Bot conectado como {bot.user}")
    print("Usa '!sync' en el chat para sincronizar los comandos de barra.")

async def load_extensions():
    # Usamos pathlib para obtener la ruta absoluta del directorio actual
    current_dir = Path(__file__).parent
    commands_dir = current_dir / "src" / "commands"
    
    for filename in os.listdir(commands_dir):
        if filename.endswith(".py") and not filename.startswith("_"):
            ext_name = f"src.commands.{filename[:-3]}"
            try:
                await bot.load_extension(ext_name)
                print(f"Cargada extensión: {ext_name}")
            except Exception as e:
                print(f"Error cargando {ext_name}: {e} (Tipo: {type(e).__name__})")

async def main():
    async with bot:
        await load_extensions()
        await bot.start(TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bot detenido por el usuario.")