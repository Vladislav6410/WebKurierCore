import json
import os
from typing import Dict
from config import WALLET_FILE

def _ensure_dir(path: str) -> None:
    d = os.path.dirname(os.path.abspath(path))
    os.makedirs(d, exist_ok=True)

def load_wallet() -> Dict[str, int]:
    if not os.path.exists(WALLET_FILE):
        return {}
    with open(WALLET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_wallet(wallet_data: Dict[str, int]) -> None:
    _ensure_dir(WALLET_FILE)
    with open(WALLET_FILE, "w", encoding="utf-8") as f:
        json.dump(wallet_data, f, ensure_ascii=False, indent=2)

def get_balance(user_id: int) -> int:
    wallet = load_wallet()
    return int(wallet.get(str(user_id), 0))

def add_balance(user_id: int, amount: int) -> int:
    wallet = load_wallet()
    uid = str(user_id)
    wallet[uid] = int(wallet.get(uid, 0)) + int(amount)
    save_wallet(wallet)
    return wallet[uid]