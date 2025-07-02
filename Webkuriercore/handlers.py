# handlers.py — обработчики команд бота WebKurierCoreBot

from telebot import TeleBot
from telebot.types import Message
from wallet import get_balance, add_balance

bot: TeleBot = None  # будет установлен из main.py

def register_handlers(bot_instance: TeleBot):
    global bot
    bot = bot_instance

    # Команда /start
    @bot.message_handler(commands=["start"])
    def handle_start(message: Message):
        bot.send_message(message.chat.id,
                         "👋 Привет! Это WebKurierCoreBot.\n"
                         "Доступны команды: /help, /wallet, /addcoins, /info")

    # Команда /help
    @bot.message_handler(commands=["help"])
    def handle_help(message: Message):
        bot.send_message(message.chat.id,
                         "🛠 Справка:\n"
                         "/start — запуск\n"
                         "/wallet — показать баланс WebCoin\n"
                         "/addcoins — +10 монет\n"
                         "/info — информация о системе")

    # Команда /wallet
    @bot.message_handler(commands=["wallet"])
    def handle_wallet(message: Message):
        user_id = str(message.from_user.id)
        coins = get_balance(user_id)
        bot.send_message(message.chat.id,
                         f"💰 Ваш баланс: {coins} WebCoin")

    # Команда /addcoins
    @bot.message_handler(commands=["addcoins"])
    def handle_addcoins(message: Message):
        user_id = str(message.from_user.id)
        add_balance(user_id, 10)
        new_balance = get_balance(user_id)
        bot.send_message(message.chat.id,
                         f"➕ Добавлено 10 монет!\n💼 Новый баланс: {new_balance} WebCoin")

    # Команда /info
    @bot.message_handler(commands=["info"])
    def handle_info(message: Message):
        bot.send_message(message.chat.id,
                         "📦 WebKurierCoreBot v1.0\n"
                         "Интеграция: Терминал + WebCoin + Telegram\n"
                         "🧩 Используется файл wallet.json")