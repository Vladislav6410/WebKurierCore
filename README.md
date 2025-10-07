![Stars](https://img.shields.io/github/stars/Vladislav6410/WebKurierCore?style=social)
![Forks](https://img.shields.io/github/forks/Vladislav6410/WebKurierCore?style=social)
![License](https://img.shields.io/github/license/Vladislav6410/WebKurierCore)
# WebKurierCore <a class="btn-primary" href="report-ui.html">📄 Сформировать отчёт</a>
[![🚀 Открыть WebKurierCore](https://img.shields.io/badge/🚀_Открыть_WebKurierCore-0a84ff?style=for-the-badge)](https://vladislav6410.github.io/WebKurierCore/)
[![GitHub Pages – Deploy](https://github.com/vladislav6410/WebKurierCore/actions/workflows/pages.yml/badge.svg)](https://github.com/vladislav6410/WebKurierCore/actions/workflows/pages.yml)
[![Open Site](https://img.shields.io/badge/Open%20Site-Live-brightgreen)](https://vladislav6410.github.io/WebKurierCore/)
![Last Commit](https://img.shields.io/github/last-commit/vladislav6410/WebKurierCore)
![Repo Size](https://img.shields.io/github/repo-size/vladislav6410/WebKurierCore)
🌐 [Открыть WebKurierCore онлайн](https://vladislav6410.github.io/WebKurierCore/)WebKurierCore

🌐 HTML-интерфейс для автономного доступа к WebKurier: терминал, WebCoin-кошелёк, офлайн-доступ и поддержка QR.

---

## 🚀 О проекте

**WebKurierCore** — это автономный HTML-интерфейс, который работает без сервера и подключений, прямо в браузере. Он предназначен для использования как локальный помощник или загрузочная оболочка WebKurier на GitHub Pages, флешке или ISO-диске.

---
### 🔧 Setup
1. Скопируйте `.env.example` → `.env`
2. Укажите реальные ключи (`TELEGRAM_TOKEN`, `STRIPE_SECRET`, `MAKE_WEBHOOK_URL`)
3. Запустите сервер:
   ```bash
   npm run dev
## 🧩 Возможности

- ✅ **WebCoin-кошелёк** с локальным сохранением
- ✅ **Интерактивный терминал** с командами (ping, help, info)
- ✅ **Тёмная/светлая тема** (автоматическое переключение)
- ✅ **Офлайн-режим** (можно открыть без интернета)
- ✅ **Поддержка GitHub Pages** (`index.html` в корне)
- ✅ **QR-код и Telegram-ссылки**
- ✅ **Минималистичный дизайн, чистый HTML/JS/CSS**
- ✅ **Совместимость с Telegram-ботами (уровень 8 и выше)**

---
📂 **Структура проекта**

```bash
project-root/
├── .github/                     # CI/CD, Actions
│   └── workflows/
│       └── ci.yml
├── WebKurierCore/               # фронтенд интерфейс / документация
├── engine/                      # ядро всех агентов
│   ├── agents/
│   │   ├── romantic/
│   │   │   ├── integrations/    # Telegram, WhatsApp коннекторы
│   │   │   ├── memory/          # история и feedback
│   │   │   ├── prompts/         # фразы, шаблоны
│   │   │   ├── tools/           # служебные скрипты
│   │   │   ├── romantic-agent.js
│   │   │   └── config.json
│   │   ├── programmer/
│   │   ├── techsupport/
│   │   └── ...                  # другие агенты
│   ├── config/                  # конфигурации и shared-модули
│   ├── logs/                    # логи и диагностика
│   └── ...
├── server/                      # Express-сервер и Webhook-интеграции
│   └── index.js
├── .env                         # приватные ключи (в .gitignore)
├── .env.example                 # шаблон окружения для GitHub
├── .gitignore                   # ⚙️ настройки исключений Git
├── package.json
├── README.md
└── statuses.md
📂 WebKurierCore
	•	🧾 index.html — 🌐 Главная страница
	•	💻 terminal.js — Интерфейс терминала
	•	💰 wallet.js — Кошелёк WebCoin
	•	🎨 styles.css — Стили сайта
	•	📘 README.md — Инструкция проекта
	•	📁 i18n/
  ↳ 🌍 i18n.js — Логика мультиязычия
	•	📁 lang-select/
  ↳ 🚩 flags.html — Выбор языка (22 флага)
	•	📁 translations/
  ↳ 🇷🇺 ru.json
  ↳ 🇬🇧 en.json
  ↳ 🇩🇪 de.json
  ↳ 🇫🇷 fr.json
  ↳ 🇵🇱 pl.json
  ↳ 🇨🇿 cs.json
  ↳ 🇷🇴 ro.json
  ↳ 🇧🇬 bg.json
  ↳ 🇱🇹 lt.json
  ↳ 🇭🇷 hr.json
  ↳ 🇭🇺 hu.json
  ↳ 🇩🇰 da.json
  ↳ 🇪🇸 es.json
  ↳ 🇮🇹 it.json
  ↳ 🇺🇦 uk.json
  ↳ 🇳🇴 no.json
  ↳ 🇵🇹 pt.json
  ↳ 🇹🇷 tr.json
  ↳ 🇸🇮 sl.json
  ↳ 🇬🇷 el.json
  ↳ 🇷🇸 sr.json
  ↳ 🇱🇻 lv.json
  ↳ 🇪🇪 et.json
  ↳ 🇳🇱 nl.json
