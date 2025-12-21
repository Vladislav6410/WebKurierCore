import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
WALLET_FILE = os.getenv("WALLET_FILE", "../data/wallet.json").strip()

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is empty. Put it into /bot/.env (do NOT commit it).")
if ADMIN_ID == 0:
    raise RuntimeError("ADMIN_ID is empty/invalid. Set ADMIN_ID in /bot/.env.")