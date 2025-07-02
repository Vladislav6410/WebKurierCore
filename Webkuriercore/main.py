# main.py — основной файл запуска бота WebKurierCoreBot

import telebot
from config import BOT_TOKEN
from handlers import register_handlers

# Инициализация бота
bot = telebot.TeleBot(BOT_TOKEN)

# Регистрация команд и логики
register_handlers(bot)

# Запуск бота
print("✅ Бот запущен. Ожидает команды в Telegram...")
bot.polling(none_stop=True)