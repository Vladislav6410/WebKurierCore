# WebKurier Admin Bot (Telegram)

Админ-бот — это приватная консоль управления WebKurier:
- статусы Core/PhoneCore/Security/Chain
- управление агентами (on/off/restart)
- логи/ошибки (по API)
- управление моделями (позже через LLM Router)

## ✅ Безопасность (обязательно)
- ❌ НЕ хранить токены в репозитории
- ✅ Токен только через ENV `TELEGRAM_ADMIN_BOT_TOKEN`
- ✅ Доступ только по allowlist `ADMIN_IDS`
- ✅ Команды админ-бота должны работать только в личке (Direct Messages only)

---

## 📦 Структура (пример)
```txt
WebKurierCore/bots/admin/
├── bot.py
├── router.py
├── security.py
├── handlers/
│   ├── start.py
│   ├── help.py
│   └── agents.py
├── services/
│   └── core_api.py
├── .env.example
└── systemd/
    └── webkurier-admin-bot.service


⸻

🔧 Переменные окружения

Смотри .env.example.

Минимально нужно:
	•	TELEGRAM_ADMIN_BOT_TOKEN
	•	ADMIN_IDS

⸻

🚀 Быстрый запуск (локально / на сервере)

1) Создай виртуальное окружение

cd WebKurierCore/bots/admin
python3 -m venv .venv
source .venv/bin/activate

2) Установи зависимости

pip install -U pip
pip install aiogram aiohttp python-dotenv

3) Подготовь .env (на сервере)

cp .env.example .env
nano .env

4) Запусти polling

export $(grep -v '^#' .env | xargs) 2>/dev/null || true
python3 bot.py

Проверка: напиши админ-боту /start и /help.

⸻

🧪 Проверка токена (быстро)

curl "https://api.telegram.org/bot$TELEGRAM_ADMIN_BOT_TOKEN/getMe"


⸻

🛠 Команды Admin Bot (MVP)
	•	/start — панель администратора
	•	/help — справка
	•	/agents — список агентов (через Core Admin API)
	•	/agent_on <agent> — включить агента
	•	/agent_off <agent> — отключить агента
	•	/agent_restart <agent> — перезапустить агента

⸻

🔌 Core Admin API (если команды /agents и agent_* нужны)

Админ-бот ожидает, что WebKurierCore поднимет эндпоинты:
	•	GET  {CORE_ADMIN_API_URL}/agents
	•	POST {CORE_ADMIN_API_URL}/agents/on      body: {“agent”:“translator”}
	•	POST {CORE_ADMIN_API_URL}/agents/off     body: {“agent”:“translator”}
	•	POST {CORE_ADMIN_API_URL}/agents/restart body: {“agent”:“translator”}

По умолчанию:
	•	CORE_ADMIN_API_URL=http://127.0.0.1:8080/admin

Если API пока нет — команды управления агентами будут возвращать ошибку подключения (это нормально на этапе MVP).

⸻

🧷 Продакшен-запуск через systemd (рекомендуется)

Готовый unit-файл лежит в systemd/webkurier-admin-bot.service.

Шаги:

sudo mkdir -p /opt/webkurier/WebKurierCore
# (положи репо/код туда или укажи свой путь)

sudo cp systemd/webkurier-admin-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable webkurier-admin-bot
sudo systemctl start webkurier-admin-bot
sudo systemctl status webkurier-admin-bot -n 50

Логи:

journalctl -u webkurier-admin-bot -f


⸻

✅ Важно про BotFather Commands

BotFather хранит только:
	•	список команд
	•	короткие описания

Логика и тексты ответов /start и /help живут в коде (handlers/start.py, handlers/help.py).

---

### 📄 Файл: `WebKurierCore/bots/admin/.env.example`

**Содержимое файла (скопировать):**
```env
# Telegram Admin Bot token (BotFather) — НЕ КОМИТИТЬ!
TELEGRAM_ADMIN_BOT_TOKEN=123456:ABCDEF_your_token_here

# Allowlist Telegram user IDs (admins), comma-separated
# Example: ADMIN_IDS=123456789,987654321
ADMIN_IDS=123456789

# WebKurierCore Admin API base URL
# Bot uses: {CORE_ADMIN_API_URL}/agents and /agents/on|off|restart
CORE_ADMIN_API_URL=http://127.0.0.1:8080/admin

# Core API timeout (seconds)
CORE_API_TIMEOUT=8


⸻



