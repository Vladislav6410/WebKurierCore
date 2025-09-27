# 💞 Romantic Agent

Цифровой собеседник для романтического общения.  
Запоминает предпочтения, учится на обратной связи, работает в **Telegram** и **WhatsApp**.

---

## 📂 Структураromantic/
├── memory/          # персональная история пользователей + feedback для самообучения
│   ├── users/       # JSON-файлы с историей и настройками
│   └── feedback/    # новые фразы для самообучения (compliments_new.txt и др.)
├── prompts/         # библиотеки фраз (compliments, date ideas, night stories, soothing)
├── tools/           # служебные скрипты (merge_feedback.js)
├── integrations/    # коннекторы для мессенджеров (telegram.js, whatsapp.js)
├── tests/           # автотесты Romantic Agent
└── romantic-agent.js# ядро агента (обработка сообщений, память, логика)---

## 🚀 Запуск (когда будет доступ к ПК/серверу)

### Telegram
1. Получите токен бота в [BotFather](https://t.me/BotFather).
2. Установите библиотеку:
```bash
npm install node-telegram-bot-api3.	Задайте токен как переменную окружения (или добавьте в config.json — см. примечание ниже):