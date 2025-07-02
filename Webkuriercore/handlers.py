# handlers.py — обработчики команд WebKurierCoreBot

from telebot import TeleBot
from telebot.types import Message

wallet_db = {}

def register_handlers(bot: TeleBot):

    def log_command(command: str, message: Message):
        print(f"[LOG] {command} от @{message.from_user.username} (ID: {message.from_user.id})")

    @bot.message_handler(commands=["help"])
    def handle_help(message: Message):
        log_command("/help", message)
        bot.send_message(message.chat.id,
            "🛠 Справка:\n"
            "/start — запуск\n"
            "/wallet — показать баланс WebCoin\n"
            "/info — информация о системе")

    @bot.message_handler(commands=["wallet"])
    def handle_wallet(message: Message):
        log_command("/wallet", message)
        user_id = str(message.from_user.id)
        coins = get_balance(user_id)
        bot.send_message(message.chat.id, f"💰 Ваш баланс: {coins} WebCoin")

    @bot.message_handler(commands=["info"])
    def handle_info(message: Message):
        log_command("/info", message)
        bot.send_message(message.chat.id,
            "📦 WebKurierCoreBot v1.0\n"
            "Терминал, WebCoin и Telegram-интерфейс.")

# Временная память баланса
def get_balance(user_id):
    return wallet_db.get(user_id, 0)

def add_balance(user_id, amount):
    wallet_db[user_id] = wallet_db.get(user_id, 0) + amount