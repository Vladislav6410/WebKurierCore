import json
import os
from telebot import TeleBot
from telebot.types import Message

bot: TeleBot = None  # Установится из main.py

WALLET_FILE = "wallet.json"
wallet_db = {}

# ======= Загрузка и сохранение =======

def load_wallet():
    global wallet_db
    if os.path.exists(WALLET_FILE):
        with open(WALLET_FILE, "r", encoding="utf-8") as f:
            wallet_db = json.load(f)
    else:
        wallet_db = {}

def save_wallet():
    with open(WALLET_FILE, "w", encoding="utf-8") as f:
        json.dump(wallet_db, f, indent=2, ensure_ascii=False)

# ======= Инициализация и обработчики =======

def init(bot_instance: TeleBot):
    global bot
    bot = bot_instance
    load_wallet()  # Загрузка при старте

    @bot.message_handler(commands=["start"])
    def handle_start(message: Message):
        bot.send_message(message.chat.id,
                         "👋 Привет! Это WebKurierCoreBot.\n"
                         "Команды: /wallet /add /reset /info")

    @bot.message_handler(commands=["help"])
    def handle_help(message: Message):
        bot.send_message(message.chat.id,
                         "📘 Справка:\n"
                         "/wallet — баланс\n"
                         "/add 10 — +10 монет\n"
                         "/reset — сброс\n"
                         "/info — инфо о боте")

    @bot.message_handler(commands=["wallet"])
    def handle_wallet(message: Message):
        user_id = str(message.from_user.id)
        coins = get_balance(user_id)
        bot.send_message(message.chat.id, f"💰 Баланс: {coins} WebCoin")

    @bot.message_handler(commands=["add"])
    def handle_add(message: Message):
        user_id = str(message.from_user.id)
        try:
            parts = message.text.split()
            amount = int(parts[1]) if len(parts) > 1 else 0
            if amount <= 0:
                raise ValueError()
            add_balance(user_id, amount)
            save_wallet()
            bot.send_message(message.chat.id, f"✅ Добавлено: {amount} WebCoin")
        except:
            bot.send_message(message.chat.id, "⚠️ Укажи число: /add 10")

    @bot.message_handler(commands=["reset"])
    def handle_reset(message: Message):
        user_id = str(message.from_user.id)
        wallet_db[user_id] = 0
        save_wallet()
        bot.send_message(message.chat.id, "♻️ Баланс сброшен.")

    @bot.message_handler(commands=["info"])
    def handle_info(message: Message):
        bot.send_message(message.chat.id,
                         "📦 WebKurierCoreBot v1.0\n"
                         "💰 WebCoin, JSON-хранение\n"
                         "📂 wallet.json — база кошельков")

# ======= Базовые функции работы с балансом =======

def get_balance(user_id: str) -> int:
    return wallet_db.get(user_id, 0)

def add_balance(user_id: str, amount: int):
    wallet_db[user_id] = wallet_db.get(user_id, 0) + amount