# main.py — основной файл запуска бота WebKurierCoreBot

import telebot
from config import BOT_TOKEN
import handlers

# Инициализация бота
bot = telebot.TeleBot(BOT_TOKEN)

# Инициализация обработчиков (передаём бота внутрь handlers)
handlers.init(bot)

# Запуск бота
print("✅ WebKurierCoreBot запущен. Ожидает команды в Telegram...")
bot.polling(none_stop=True)