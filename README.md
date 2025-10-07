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

## 🤖 Архитектура проекта WebKurierCore

WebKurierCore/
├── .github/                     # CI/CD, Actions
│   └── workflows/
│       └── ci.yml
├── WebKurierCore/               # фронтенд интерфейс / документация
├── engine/                      # ядро всех агентов
│   ├── agents/
│   │   ├── accountant/
│   │   ├── autopilot/
│   │   ├── hr/
│   │   ├── layout/
│   │   ├── pilot/
│   │   ├── pl-tax-return/
│   │   ├── programmer/
│   │   ├── romantic/
│   │   │   ├── integrations/    # Telegram, WhatsApp коннекторы
│   │   │   ├── memory/          # история и feedback
│   │   │   ├── prompts/         # фразы, шаблоны
│   │   │   ├── tools/           # служебные скрипты
│   │   │   ├── romantic-agent.js
│   │   │   └── config.json
│   │   ├── techsupport/
│   │   ├── telemetry/
│   │   ├── translator/
│   │   ├── voice/
│   │   └── wallet/
│   │
│   │   accountant-agent.js
│   │   autopilot-agent.js
│   │   designer-agent.js
│   │   drone-agent.js
│   │   engineer-agent.js
│   │   identity-agent.js
│   │   intelligence-agent.js
│   │   loader.js
│   │   marketing-agent.js
│   │   master-agent.js
│   │   programmer-agent.js
│   │   techsupport-agent.js
│   │   telemetry-agent.js
│   │   tools-agent.js
│   │   tools-ui.js
│   │   voice-agent.js
│   │
│   ├── config/
│   ├── logs/
│   └── ...
├── server/                      # Express-сервер и Webhook-интеграции
│   └── index.js
├── .env                         # приватные ключи (в .gitignore)
├── .env.example                 # шаблон окружения для GitHub
├── .gitignore                   # ⚙️ исключения для Git
├── package.json
├── README.md
└── statuses.md

```

## 🤖 Агентная экосистема WebKurierCore

Система построена из независимых AI-агентов, каждый решает свою задачу (романтика, код, поддержка, перевод, голос и т.д.).  
Агенты хранятся в `engine/agents/<agent>` и имеют собственные: ядро (`*-agent.js`), память (`memory/`), подсказки (`prompts/`), инструменты (`tools/`) и интеграции (`integrations/`).

### ⚙️ Основные компоненты

| Папка / файл | Назначение |
|---|---|
| `engine/agents/romantic/` | RomanticAgent — диалоги, эмоции, комплименты, истории |
| `engine/agents/programmer/` | Генерация и рефакторинг кода, анализ PR |
| `engine/agents/techsupport/` | Поддержка пользователей и диагностика |
| `engine/agents/translator/` | Переводы и i18n (JSON-локализации) |
| `engine/agents/voice/` | Голосовой интерфейс (TTS/STT) |
| `engine/agents/autopilot/` | Автоматизация сценариев и действий |
| `engine/agents/telemetry/` | Сбор метрик, логи, мониторинг |
| `engine/agents/wallet/` | WebCoin-кошелёк и операции |
| `engine/agents/hr/` | Кадровые процессы и анкеты |
| `engine/agents/pilot/` | Управление потоками/интеграциями |
| `engine/agents/designer-agent.js` | Дизайн-агент (UI/UX задачи) |
| `engine/agents/engineer-agent.js` | Инженерные расчёты/планирование |
| `engine/agents/intelligence-agent.js` | Аналитика/стратегия |
| `engine/agents/marketing-agent.js` | Маркетинг и контент |
| и др. `*-agent.js` | Дополнительные одиночные ядра агентов |

### 🧩 Взаимодействие агентов

```mermaid
graph TD
    subgraph Client
        X[🌐 WebKurierCore Interface]
        Y[💬 Telegram / WhatsApp / Webhook]
    end

    subgraph Server
        A[Express API / Webhook Router]
        B[Server Controller]
    end

    subgraph Engine
        C[engine/agents/romantic-agent.js]
        D[engine/agents/programmer-agent.js]
        E[engine/agents/techsupport-agent.js]
        F[engine/agents/telemetry-agent.js]
    end

    subgraph Data
        G[(memory/feedback)]
        H[(logs/)]
    end

    X -->|Input| Y
    Y -->|Request| A
    A -->|Route| B
    B -->|Trigger| C
    B -->|Trigger| D
    B -->|Trigger| E
    C -->|Log| H
    D -->|Store| G
    E -->|Report| H
    F -->|Monitor| H

   ```bash```bash
код
кодmarkdown ---

## 🧠 Роли и назначение агентов

Каждый агент в WebKurierCore — это автономный модуль, выполняющий свою специализированную задачу.  
Они взаимодействуют через общее ядро `engine/agents/`, обмениваясь данными и командами.

| Агент | Назначение |
|-------|-------------|
| 🤝 **accountant** | Финансовые операции, расчёты, отчётность |
| 🧭 **autopilot** | Самоуправляемые сценарии, автономные процессы |
| 👥 **hr** | Управление командами, собеседования, профили |
| 🧩 **layout** | Интерфейс, визуальные компоненты и адаптивные блоки |
| ✈️ **pilot** | Управление другими агентами, распределение задач |
| 💼 **pl-tax-return** | Налоговая отчётность для Польши |
| 👨‍💻 **programmer** | Разработка, написание и анализ кода |
| 💌 **romantic** | Эмоциональный интеллект, коммуникации и контент |
| 🛠️ **techsupport** | Техническая поддержка, диагностика, справка |
| 📡 **telemetry** | Мониторинг системы и логирование действий |
| 🌍 **translator** | Переводы между языками и локализация |
| 🎙️ **voice** | Голосовой ввод и синтез речи |
| 💰 **wallet** | Управление токенами и WebCoin-кошелёк |

🧩 Архитектура поддерживает **добавление новых агентов**,  
а также взаимодействие между ними (например, `programmer` → `techsupport` → `romantic`).  

Каждый агент имеет:
- собственный `*-agent.js` (основная логика)
- папку с вспомогательными модулями (`tools/`, `prompts/`, `memory/`)
- конфигурацию `config.json`  
- общий доступ к ядру `engine/` и логам `logs/`.

---

🧠 В сумме агенты образуют **модульную нейроархитектуру WebKurierCore**,  
где каждый компонент автономен, но способен взаимодействовать с другими,  
что делает систему гибкой, расширяемой и самоуправляемой.

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
