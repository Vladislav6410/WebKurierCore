# 📁 engine/agents/accountant/ocr-lohn.py

import pytesseract
from PIL import Image

def extract_text_from_scan(image_path):
    """
    Распознаёт текст из изображения Lohnsteuerbescheinigung.
    """
    text = pytesseract.image_to_string(Image.open(image_path), lang="deu")
    return text