# 📁 engine/agents/accountant/expenses-parser.py

import openpyxl
import json

def parse_expenses(file_path):
    """
    Обрабатывает Excel или JSON файл расходов и возвращает сумму.
    """
    if file_path.endswith(".xlsx"):
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
        total = sum([row[1].value for row in ws.iter_rows(min_row=2) if row[1].value])
        return total
    elif file_path.endswith(".json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return sum(item["amount"] for item in data.get("expenses", []))
    else:
        raise ValueError("Неподдерживаемый формат файла")