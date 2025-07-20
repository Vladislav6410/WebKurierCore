#!/bin/bash
echo "📦 Установка агента-бухгалтера WebKurier..."

# Обновление системы
sudo apt update
sudo apt install -y python3 python3-pip tesseract-ocr tesseract-ocr-deu tesseract-ocr-rus

# Переход в папку
cd "$(dirname "$0")"

# Установка Python-библиотек
pip3 install -r requirements.txt

echo "✅ Установка завершена. Готово к запуску:"
echo "👉 Запуск агента: python3 accountant-agent.py"
echo "👉 Генерация PDF: python3 pdf-export.py"