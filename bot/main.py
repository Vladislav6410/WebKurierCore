import telebot
from config import BOT_TOKEN, ADMIN_ID
from handlers import register_handlers

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=["start"])
def start_handler(message):
    if message.from_user.id == ADMIN_ID:
        bot.reply_to(message, "✅ WebKurierCoreBot активен. Привет, админ!")
        register_handlers(bot)
    else:
        bot.reply_to(message, "🚫 У вас нет прав доступа.")

if __name__ == "__main__":
    print("✅ Bot started. Waiting for commands...")
    bot.infinity_polling()