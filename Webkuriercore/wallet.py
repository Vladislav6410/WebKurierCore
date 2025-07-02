import json
import os

WALLET_FILE = "wallet.json"

# Загрузка баланса из JSON
def load_wallet():
    if not os.path.exists(WALLET_FILE):
        return {}
    with open(WALLET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# Сохранение баланса в JSON
def save_wallet(wallet_data):
    with open(WALLET_FILE, "w", encoding="utf-8") as f:
        json.dump(wallet_data, f, ensure_ascii=False, indent=2)

# Получить баланс пользователя
def get_balance(user_id):
    wallet = load_wallet()
    return wallet.get(str(user_id), 0)

# Добавить монеты пользователю
def add_balance(user_id, amount):
    wallet = load_wallet()
    user_id = str(user_id)
    wallet[user_id] = wallet.get(user_id, 0) + amount
    save_wallet(wallet)