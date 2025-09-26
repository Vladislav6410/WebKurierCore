# 💞 Romantic Agent

Цифровой собеседник для романтического общения.  
Хранит персональные предпочтения, учится на обратной связи, может работать в **Telegram** и **WhatsApp**.

---

## 📂 Структураromantic/
├── memory/          # персональная история пользователей + feedback для самообучения
├── prompts/         # библиотеки фраз (compliments, date ideas, stories…)
├── tools/           # служебные скрипты (например merge_feedback.js)
├── integrations/    # подключение к мессенджерам (telegram.js, whatsapp.js)
└── romantic-agent.js# ядро агента (обработка сообщений, память, логика)- `memory/` — хранит историю общения, настройки пользователя, новые фразы для самообучения.  
- `prompts/` — готовые тексты: комплименты, идеи для свиданий, ночные истории.  
- `tools/merge_feedback.js` — объединяет новые фразы из `memory/feedback` в основные промпты.  
- `integrations/telegram.js` и `integrations/whatsapp.js` — запуск бота в мессенджерах.  
- `romantic-agent.js` — ядро логики агента (подбор ответов, работа с памятью).

---

## 🚀 Запуск (когда будет готово)

### Telegram
1. Получите токен в [BotFather](https://t.me/BotFather).
2. Введите токен как переменную окружения:
   ```bash
   export TELEGRAM_TOKEN=123456789:ABCDEF...