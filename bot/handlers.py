from telebot import TeleBot
from telebot.types import Message
from wallet import get_balance, add_balance

def register_handlers(bot: TeleBot) -> None:

    def log_command(command: str, message: Message) -> None:
        uname = getattr(message.from_user, "username", None) or "-"
        print(f"[BOT] {command} from @{uname} (ID:{message.from_user.id})")

    @bot.message_handler(commands=["help"])
    def handle_help(message: Message):
        log_command("/help", message)
        bot.send_message(
            message.chat.id,
            "🛠 Справка:\n"
            "/start — запуск\n"
            "/wallet — показать баланс WebCoin\n"
            "/add10 — добавить 10 WebCoin (тест)\n"
            "/info — информация о системе"
        )

    @bot.message_handler(commands=["wallet"])
    def handle_wallet(message: Message):
        log_command("/wallet", message)
        coins = get_balance(message.from_user.id)
        bot.send_message(message.chat.id, f"💰 Ваш баланс: {coins} WebCoin")

    @bot.message_handler(commands=["add10"])
    def handle_add10(message: Message):
        log_command("/add10", message)
        new_balance = add_balance(message.from_user.id, 10)
        bot.send_message(message.chat.id, f"✅ Начислено +10. Баланс: {new_balance} WebCoin")

    @bot.message_handler(commands=["info"])
    def handle_info(message: Message):
        log_command("/info", message)
        bot.send_message(
            message.chat.id,
            "📦 WebKurierCoreBot (MVP)\n"
            "Терминал, WebCoin и Telegram-интерфейс.\n"
            "Архитектура: User → Core → Hub → Core → User"
        )