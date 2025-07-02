# main.py — запуск WebKurierCoreBot с проверкой прав и регистрацией команд

import json
import telebot
from handlers import register_handlers

# Загрузка настроек из config.json
with open("core/config/config.json", "r", encoding="utf-8") as f:
    config = json.load(f)

BOT_TOKEN = config["bot_token"]
ADMIN_ID = int(config["admin_id"])

# Инициализация бота
bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=["start"])
def start_handler(message):
    if message.from_user.id == ADMIN_ID:
        bot.reply_to(message, "✅ WebKurierCoreBot активен. Привет, админ!")
        register_handlers(bot)  # Подключаем все остальные команды
    else:
        bot.reply_to(message, "🚫 У вас нет прав доступа.")

# Запуск бота
print("✅ Бот запущен и ожидает команды...")
bot.polling(none_stop=True)