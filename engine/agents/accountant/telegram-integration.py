# 📁 engine/agents/accountant/telegram-integration.py

import requests

def notify_telegram(user_id, message, token):
    """
    Отправляет сообщение в Telegram через бота WebKurier.
    """
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = {"chat_id": user_id, "text": message}
    r = requests.post(url, data=data)
    return r.status_code == 200