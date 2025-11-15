# 📘README.md — WebKurierCore (EN + RU)

Unified Web Interface • Agents Engine • Bots • Multilingual • Offline-ready

Made in Germany 🇩🇪
Core of the WebKurier Ecosystem

⸻

🇬🇧 WebKurierCore — Universal Web Interface & Agent Engine

WebKurierCore is the central HTML/JS interface and agent engine of the WebKurier ecosystem.
It works offline, directly in the browser, with full support for:
	•	Web-based terminal
	•	WebCoin wallet
	•	Multilingual UI
	•	Telegram & WhatsApp bots
	•	Local AI agents
	•	Admin control panel
	•	Integration with drones, security modules, blockchain, accountant, and mobile apps

It can run from:
	•	GitHub Pages
	•	USB stick
	•	Local folder
	•	ISO LiveCD
	•	Any static web server

⸻

🚀 Project Overview

WebKurierCore provides:

✅ Autonomous HTML-based interface
✅ Terminal with commands (ping, help, info, /security, /pilot, /geo)
✅ WebCoin wallet with local storage
✅ Full offline mode
✅ GitHub Pages support
✅ QR and direct links to Telegram bots
✅ Multilingual UI (EN/DE/RU/UK now, more later)
✅ Integration with WebKurierDroneHybrid, WebKurierChain, PhoneCore
✅ Full agent-based architecture (engine/agents/*)

This is the central brain of the WebKurier system.

⸻

🔧 Setup
	1.	Copy .env.example → .env
	2.	Insert real keys:
	•	TELEGRAM_TOKEN
	•	STRIPE_SECRET
	•	MAKE_WEBHOOK_URL
	•	(optional) GPT / AI provider keys
	3.	Start the local server:

npm install
npm run dev


⸻

🧩 Features
	•	WebCoin Wallet
	•	Interactive Terminal
	•	Theme switcher (dark/light/auto)
	•	Offline mode (no server needed)
	•	Full integration with bots
	•	Minimal, fast HTML/JS/CSS
	•	Public Web UI for all WebKurier subsystems
	•	Language selector with flags
	•	Connection to PhoneCore (translator, lessons, calls)
	•	Connection to DroneHybrid (autopilot, missions, geodesy)
	•	Connection to Security (scan, quarantine, alerts)
	•	Connection to Chain (blockchain storage, accountant)

⸻

📂 Updated Project Structure

WebKurierCore/
├── .github/
│   └── workflows/ci.yml
├── WebKurierCore/                  # Frontend root
├── i18n/                            # Localizations (EN, DE, RU, UK…)
│   ├── en.json
│   ├── de.json
│   ├── ru.json
│   └── uk.json
├── engine/
│   ├── agents/
│   │   ├── accountant/             # (linked to Chain)
│   │   ├── autopilot/              # DroneHybrid integration
│   │   ├── hr/
│   │   ├── layout/
│   │   ├── pilot/
│   │   ├── pl-tax-return/
│   │   ├── programmer/
│   │   ├── romantic/
│   │   ├── techsupport/
│   │   ├── telemetry/
│   │   ├── translator/             # PhoneCore connection
│   │   ├── voice/                  # TTS/STT
│   │   ├── wallet/
│   │   ├── legal/                  # (moved from legal repo)
│   │   └── security/               # hooks from WebKurierSecurity
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
├── bots/
│   ├── telegram/
│   │   ├── level8/
│   │   └── geodesy_bot/
│   ├── whatsapp/
│   └── web-admin/
│       ├── index.html
│       ├── roles/
│       └── auth-check.js
├── server/
│   └── index.js                   # Webhook router
├── terminal.js
├── wallet.js
├── styles.css
├── index.html
├── .env
├── .env.example
├── package.json
└── README.md


⸻

🤖 Agent Ecosystem (Updated)

Agents are modular AI units.
Each agent has:
	•	*-agent.js core
	•	memory/
	•	tools/
	•	prompts/
	•	config.json

New integrations:

Agent	Purpose
translator	Linked to WebKurierPhoneCore
autopilot	Linked to WebKurierDroneHybrid
security	Linked to WebKurierSecurity
accountant	Data stored in WebKurierChain
lawyer/legal	lives now inside Core (security repo moved here)
pilot	manages multi-agent decisions
AI-case	supports lessons, tasks, forms


⸻

🔗 Global Integration Map

WebKurierCore
   ├── Bots (Telegram, WhatsApp, WebApp)
   ├── Agents Engine
   ├── Web UI (terminal + wallet + admin)
   │
   ├──→ WebKurierDroneHybrid      # autopilot, geodesy, missions
   ├──→ WebKurierSecurity         # scans, quarantine, GDPR
   ├──→ WebKurierChain            # blockchain, accountant
   ├──→ WebKurierPhoneCore        # translator, calls, lessons
   └──→ WebKurierSite             # landing & documentation


⸻

🧠 Roles of Key Agents (EN/RU)

Agent	Description (EN)	Описание (RU)
accountant	Finance, reports, tax logic	Финансы, отчёты, НДС
autopilot	Controls DroneHybrid	Управление автопилотом
translator	PhoneCore translator	Переводчик + уроки
voice	Voice interface	Голосовой ввод/вывод
security	Alerts, scanning	Безопасность, сканирование
legal	Legal templates checker	Юридический помощник
techsupport	Diagnostics	Техподдержка
programmer	Code generation	Программирование
romantic	Creative dialogues	Романтика/истории
pilot	Multi-agent orchestrator	Управление другими агентами
intelligence	Analysis	Аналитика
wallet	WebCoin	Система WebCoin


⸻

🎛 Terminal Commands (Updated)

ping
help
info
/security scan
/wallet balance
/pilot status
/geo analyze
/phone call user
/bot restart


⸻

🌐 Multilingual UI

Supported:
	•	English 🇬🇧
	•	German 🇩🇪
	•	Russian 🇷🇺
	•	Ukrainian 🇺🇦

Expandable to:
	•	Polish, Croatian, Spanish, Italian…

⸻

🧾 Reports

Core can generate:
	•	PDF (Unicode DejaVu support)
	•	DOCX
	•	JSON
	•	ZIP
	•	HTML exports

⸻

📜 License

© 2025 Vladyslav Hushchyn
Made in Germany 🇩🇪
Part of the WebKurier Ecosystem.

⸻

✅ ГОТОВО


  
