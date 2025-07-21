# engine/agents/accountant/parser.py

import os
import json
import pytesseract
from PIL import Image
import openpyxl

def parse_lohn_image(image_path):
    """Распознаёт текст из Lohnsteuerbescheinigung (скан)"""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='deu')
        return {'raw_text': text}
    except Exception as e:
        return {'error': str(e)}

def parse_expenses_excel(file_path):
    """Парсит Excel-файл с расходами"""
    results = []
    try:
        wb = openpyxl.load_workbook(file_path)
        sheet = wb.active
        for row in sheet.iter_rows(min_row=2, values_only=True):
            date, description, amount = row
            if date and amount:
                results.append({
                    'date': str(date),
                    'description': description,
                    'amount': float(amount)
                })
        return results
    except Exception as e:
        return {'error': str(e)}

def parse_contracts_json(json_path):
    """Загружает данные контрактов из JSON"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {'error': str(e)}

# Пример вызова (можно удалить в продакшене)
if __name__ == '__main__':
    print(parse_lohn_image("data/scan.jpg"))
    print(parse_expenses_excel("data/expenses.xlsx"))
    print(parse_contracts_json("data/contracts.json"))