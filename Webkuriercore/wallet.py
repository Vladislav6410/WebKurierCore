import json
import os

WALLET_FILE = "wallet.json"

# Загрузка базы балансов
def load_wallet():
    if not os.path.exists(WALLET_FILE):
        return {}
    with open(WALLET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# Сохранение базы балансов
def save_wallet(data):
    with open(WALLET_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Получение баланса пользователя
def get_balance(user_id: str) -> int:
    db = load_wallet()
    return db.get(user_id, 0)

# Увеличение баланса
def add_balance(user_id: str, amount: int) -> int:
    db = load_wallet()
    db[user_id] = db.get(user_id, 0) + amount
    save_wallet(db)
    return db[user_id]

# Установка точного баланса
def set_balance(user_id: str, amount: int) -> int:
    db = load_wallet()
    db[user_id] = amount
    save_wallet(db)
    return amount

# Сброс баланса
def reset_balance(user_id: str) -> int:
    return set_balance(user_id, 0)