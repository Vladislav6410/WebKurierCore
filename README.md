import qrcode
from zipfile import ZipFile
import os

# 1. Параметры
data_dir = "/mnt/data"
os.makedirs(data_dir, exist_ok=True)

html_filename = "webkurier_core_summary.html"
qr_filename = "webkurier_qr.png"
zip_filename = "webkurier_package.zip"

html_path = os.path.join(data_dir, html_filename)
qr_path = os.path.join(data_dir, qr_filename)
zip_path = os.path.join(data_dir, zip_filename)

# 2. Контент HTML-файла
html_content = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>WebKurier</title></head>
<body><h1>WebKurier Core</h1><p>Файл содержит основное описание ядра.</p></body></html>
"""

# 3. Сохраняем HTML
try:
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
except Exception as e:
    print(f"Ошибка при записи HTML: {e}")

# 4. Генерация QR-кода
drive_folder_url = "https://example.com/your-folder"  # замените на реальную ссылку
qr_img = qrcode.make(drive_folder_url)
qr_img.save(qr_path)

# 5. Упаковка в ZIP
try:
    with ZipFile(zip_path, 'w') as zipf:
        zipf.write(html_path, arcname=html_filename)
        zipf.write(qr_path, arcname=qr_filename)
except Exception as e:
    print(f"Ошибка при создании архива: {e}")

# 6. Удаление временных файлов (по желанию)
os.remove(html_path)
os.remove(qr_path)

print(f"Архив создан: {zip_path}")

