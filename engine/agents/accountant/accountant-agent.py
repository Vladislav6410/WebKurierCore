# 📁 engine/agents/accountant/accountant-agent.py

import os
import json
from datetime import datetime

class AccountantAgent:
    def __init__(self, config_path='engine/agents/accountant/config.json'):
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        self.dropbox_path = self.config.get("dropbox_path", "/Taxes/")
        self.years = self.config.get("years", [])
        self.user_id = self.config.get("user_id", "anonymous")

    def list_tax_years(self):
        print(f"[👨‍💼] Налоговые годы: {', '.join(self.years)}")
        return self.years

    def get_documents_for_year(self, year):
        path = os.path.join(self.dropbox_path, year)
        print(f"[📂] Чтение документов из папки: {path}")
        # В реальности — подключение к Dropbox API
        return os.listdir(path) if os.path.exists(path) else []

    def analyze_lohnsteuer(self, filepath):
        print(f"[🔍] Анализ Lohnsteuerbescheinigung: {filepath}")
        # TODO: PDF/скан парсинг, OCR, извлечение данных
        data = {
            "Brutto": 30000,
            "Steuer": 4500,
            "Versicherung": 2400
        }
        return data

    def estimate_refund(self, data):
        print("[💶] Расчёт возможного возврата налога...")
        brutto = data.get("Brutto", 0)
        tax = data.get("Steuer", 0)
        insurance = data.get("Versicherung", 0)
        refund = max(0, tax - insurance * 0.2)
        return round(refund, 2)

    def generate_declaration(self, year, save_path='output/steuererklärung.json'):
        print(f"[🧾] Формирование декларации за {year}...")
        docs = self.get_documents_for_year(year)
        lohn_file = next((f for f in docs if 'Lohn' in f), None)
        if not lohn_file:
            print("[⚠️] Не найден файл Lohnsteuerbescheinigung")
            return None

        data = self.analyze_lohnsteuer(os.path.join(self.dropbox_path, year, lohn_file))
        refund = self.estimate_refund(data)

        declaration = {
            "user": self.user_id,
            "year": year,
            "brutto": data["Brutto"],
            "tax_paid": data["Steuer"],
            "insurance": data["Versicherung"],
            "estimated_refund": refund,
            "created": datetime.now().isoformat()
        }

        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(declaration, f, indent=2, ensure_ascii=False)

        print(f"[✅] Декларация сохранена: {save_path}")
        return declaration