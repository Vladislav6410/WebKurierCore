# 📊 WebKurier Accountant Agent

**Цифровой агент для автоматизации подачи налоговых деклараций в Германии (и других странах ЕС).**

---

## 🧾 Назначение

Агент собирает налоговые данные, анализирует документы (Lohnsteuerbescheinigung, расходы, контракты), рассчитывает возможный возврат, формирует шаблон декларации и сохраняет результат в формате JSON/PDF/XML.

---

## 📁 Структура папки# 📊 Accountant Agent

Цифровой помощник для подачи налоговой декларации (Германия).

## 📂 Файлы

- `accountant-agent.py` — основной агент.
- `elster-export.py` — экспорт в формат ELSTER XML.
- `expenses-parser.py` — анализ расходов (Excel, JSON).
- `ocr-lohn.py` — OCR сканов Lohnsteuerbescheinigung.
- `telegram-integration.py` — связь с Telegram-ботом.
- `config.json` — профиль, язык, Dropbox.
- `taxes-gui.html`, `taxes-ui.js`, `i18n.js` — Web-интерфейс.