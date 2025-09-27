# 💞 Romantic Agent

Цифровой собеседник для романтического общения.  
Запоминает предпочтения, учится на обратной связи, работает в **Telegram** и **WhatsApp**.

---

## 📂 Структура

romantic/ ├── memory/          # персональная история пользователей + feedback для самообучения │   ├── users/       # JSON-файлы с историей и настройками │   └── feedback/    # новые фразы для самообучения (compliments_new.txt и др.) ├── prompts/         # библиотеки фраз (compliments, date ideas, night stories, soothing) ├── tools/           # служебные скрипты (merge_feedback.js) ├── integrations/    # коннекторы для мессенджеров (telegram.js, whatsapp.js) ├── tests/           # автотесты Romantic Agent └── romantic-agent.js# ядро агента (обработка сообщений, память, логика)
---

## 🚀 Запуск (когда будет доступ к ПК/серверу)

### Telegram
1. Получите токен бота в [BotFather](https://t.me/BotFather).
2. Установите библиотеку:

npm install node-telegram-bot-api
3. Задайте токен как переменную окружения (или добавьте в config.json — см. примечание ниже):

export TELEGRAM_TOKEN=1234567890:ABCDEF…
(Windows PowerShell):


4. Запустите:

node engine/agents/romantic/integrations/telegram.js
💡 Примечание:  
Если удобнее, вместо `export TELEGRAM_TOKEN=...` можно вписать токен напрямую в `engine/config.json` (ключ `telegram_token`).

---

### WhatsApp
1. Установите зависимости:

npm install @adiwajshing/baileys qrcode-terminal
2. Запустите:

node engine/agents/romantic/integrations/whatsapp.js
3. При первом запуске появится QR-код — отсканируйте его в WhatsApp (Меню → Связанные устройства).  
Сессионные ключи сохраняются в `.wa-auth-romantic/` (папка занесена в `.gitignore`).

---

## 🧠 Самообучение
1. Новые фразы попадают в `memory/feedback/*.txt`.
2. Чтобы объединить их с основными:

node engine/agents/romantic/tools/merge_feedback.js
---

## 🔐 Безопасность
- Не загружайте токены и `.wa-auth-romantic/` в публичные репозитории.  
- Добавьте в `.gitignore`:

.wa-auth-romantic/ .env
---

## ☁️ Dropbox

Если в `engine/config.json` включить:

“dropbox_memory”: true
то история пользователей будет синхронизироваться с Dropbox.

---

## ✅ Тесты

Запуск юнит-тестов (при доступе к Node.js):

npx jest engine/agents/romantic/tests/romantic.spec.js
---

### 🟢 Итог

- ✅ Всё твоё содержание сохранено.  
- 🔥 Поправлена только разметка Markdown, чтобы GitHub и Dropbox отображали красиво.  
- 📝 Пункт про `export TELEGRAM_TOKEN` оставлен (плюс добавлено примечание про `config.json`).
