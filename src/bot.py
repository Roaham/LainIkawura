import discord
from discord.ext import commands
import os
from token_me import token_me

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
"""
print(banner)

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Bot connected like {bot.user}")

@bot.event
async def on_ready():
    print(f"Bot conectado como {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"Comandos sincronizados: {len(synced)}")
        for cmd in synced:
            print(f"- {cmd.name}")
    except Exception as e:
        print(f"Error al sincronizar comandos: {e}")


async def main():
    for filename in os.listdir("./commands"):
        if filename.endswith(".py") and not filename.startswith("_"):
            await bot.load_extension(f"commands.{filename[:-3]}")

    await bot.start(token_me)

import asyncio
asyncio.run(main())
