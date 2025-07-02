# handlers.py — обработчики команд бота

from telebot import TeleBot
from telebot.types import Message

bot: TeleBot = None  # будет установлен из main.py

def init(bot_instance: TeleBot):
    global bot
    bot = bot_instance

    # Команда /start
    @bot.message_handler(commands=["start"])
    def handle_start(message: Message):
        bot.send_message(message.chat.id,
                         "👋 Привет! Это WebKurierCoreBot.\n"
                         "Доступны команды: /help, /wallet, /info")

    # Команда /help
    @bot.message_handler(commands=["help"])
    def handle_help(message: Message):
        bot.send_message(message.chat.id,
                         "🛠 Справка:\n"
                         "/start — запуск\n"
                         "/wallet — показать баланс WebCoin\n"
                         "/info — информация о системе")

    # Команда /wallet
    @bot.message_handler(commands=["wallet"])
    def handle_wallet(message: Message):
        user_id = str(message.from_user.id)
        coins = get_balance(user_id)
        bot.send_message(message.chat.id,
                         f"💰 Ваш баланс: {coins} WebCoin")

    # Команда /info
    @bot.message_handler(commands=["info"])
    def handle_info(message: Message):
        bot.send_message(message.chat.id,
                         "📦 WebKurierCoreBot v1.0\n"
                         "Терминал, WebCoin и Telegram-интерфейс.")

# Простая внутренняя база баланса (на память)
wallet_db = {}

def get_balance(user_id):
    return wallet_db.get(user_id, 0)

def add_balance(user_id, amount):
    wallet_db[user_id] = wallet_db.get(user_id, 0) + amount