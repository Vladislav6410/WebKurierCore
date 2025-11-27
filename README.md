## EN

**WebKurierCore** is the **primary user-facing entry point** and the **cognitive coordinator** of the 10-repository WebKurier AI ecosystem.  
It routes tasks to domain hubs and may, when enabled, consult the **Second Self AI Council** to assemble consensus decisions.

### Key Capabilities

- Direct user access via Web, iOS & Android clients
- **SecondSelfAgent Council Reasoning (toggleable)**
  - Debate optimization via TurboReasoning accelerators
  - Aggregating opinions and producing consensus decisions or specialist-only answers
- **Wearable Perception Inputs**
  - Stereo wearable cameras (glasses/chest/hat positioning)
  - Microphone streaming, real-time STT/TTS advisory to earphones/speakers
  - Offline inference bypasses council calls
- **3D Building & Solar PV Commands**
  - `/pv roof` and `/pv field` plan and visualize solar placement
  - Surface modeling, plane segmentation, slope, azimuth, panel packing, seasonal shade simulation (executed in DroneHybrid, invoked here)
- **Terminal Integration**
  - Unified CLI routing to specialist agents or SecondSelf aggregated reasoning
  - FaceID/owner-level commands are allowed at runtime, not committed to Git
- **Entitlement & Pricing Control**
  - Allows users to toggle SecondSelf Advice and council invocation per mode: Free/Lite/Enhanced/Premium/Trial
  - Validated by Security and logged with decision hashes into Chain
- **Continuous Autonomy Reference**
  - UAVs continue missions locally in offline autonomy mode when disconnected

### Primary Local Paths (Current Layout)

```text
WebKurierCore/
├── index.html                           ← main user portal (agent tiles)
├── admin/
│   ├── terminal.html                    ← admin terminal UI
│   └── logs.html                        ← logs view (optional)
├── engine/
│   ├── config/
│   │   ├── agents_map.json              ← map of agent groups & routes
│   │   ├── entitlements.secondself.json ← SecondSelf tiers & modes
│   │   └── secrets.json                 ← tokens/secrets (local only, not committed)
│   ├── api/                             ← external API endpoints for Core/SecondSelf
│   │   ├── secondself_rest.py           ← REST  /secondself/query
│   │   └── secondself_ws.py             ← WebSocket /secondself/stream
│   ├── perception/                      ← wearable/sensor intake
│   │   ├── stereo_input_adapter.js      ← stereo cameras adapter (glasses/chest/hat)
│   │   ├── mic_stream_adapter.js        ← microphone adapter (phone/headset)
│   │   └── translator_rt.js             ← realtime translation & subtitles
│   ├── terminal/                        ← Core terminal logic
│   │   ├── terminal_agent.js            ← command router, link to SecondSelf
│   │   └── commands_map.json            ← command map (/pv roof, /call secondself, ...)
│   ├── agents/                          ← domain & utility agents (HTML cores)
│   │   ├── geodesy/
│   │   │   └── geodesy-core.html
│   │   ├── drone/
│   │   │   └── drone-core.html
│   │   ├── autopilot/
│   │   │   └── autopilot-core.html
│   │   ├── pilot/
│   │   │   └── pilot-core.html
│   │   ├── geoviz3d/
│   │   │   └── geoviz3d-core.html
│   │   ├── pv-planner/
│   │   │   └── pv-planner-core.html
│   │   ├── geo-report/
│   │   │   └── geo-report-core.html
│   │   ├── translator/
│   │   │   └── translator-core.html
│   │   ├── voice/
│   │   │   └── voice-core.html
│   │   ├── phone/
│   │   │   └── phone-core.html
│   │   ├── lessons/
│   │   │   └── lessons-core.html
│   │   ├── wallet/
│   │   │   └── wallet-core.html
│   │   ├── accountant/
│   │   │   └── accountant-core.html
│   │   ├── tax-return/
│   │   │   └── tax-return-core.html
│   │   ├── hr/
│   │   │   └── hr-core.html
│   │   ├── marketing/
│   │   │   └── marketing-core.html
│   │   ├── romantic/
│   │   │   └── romantic-core.html
│   │   ├── engineer/
│   │   │   └── engineer-core.html
│   │   ├── programmer/
│   │   │   └── programmer-core.html
│   │   ├── designer/
│   │   │   └── designer-core.html
│   │   ├── editor/
│   │   │   └── editor-core.html
│   │   ├── tools/
│   │   │   └── tools-core.html
│   │   ├── dream/
│   │   │   └── dream-core.html
│   │   ├── security/
│   │   │   └── security-core.html
│   │   ├── legal/
│   │   │   └── legal-core.html
│   │   ├── memory/
│   │   │   └── memory-core.html
│   │   ├── admin-terminal/
│   │   │   └── admin-terminal-core.html
│   │   ├── master/
│   │   │   └── master-core.html
│   │   ├── second-self/                 ← Second Self (council) UI + logic
│   │   │   ├── second-self-core.html    ← SecondSelf interface core
│   │   │   ├── secondself-agent.js      ← SecondSelf council brain
│   │   │   ├── council_config.json      ← council composition & weights
│   │   │   └── accelerators/
│   │   │       └── turbo_reasoning.js   ← debate/consensus accelerator
│   │   └── cafe/                        ← cafe/pizza/calendar UI
│   │       └── cafe-core.html
│   └── js/
│       └── agents-menu.js               ← dynamic tile menu for agents
└── docs/
    └── *.html                           ← docs, manuals, spec pages

Cross-Repository Cognitive Flow

User → index.html (portal) → Terminal / PhoneCore / WebRTC input
→ Core Decision Router + optional SecondSelf council
→ Domain hub (DroneHybrid / Chain / Security / PhoneCore)
→ AI response delivered by Core (text or TTS voice)

⸻

Deployment: Google Cloud Run (EU, 5–10 minutes)

This repository is prepared for Docker-based deployment to Google Cloud Run in the EU region.

Prerequisites
	•	Existing GCP project (Project ID available)
	•	gcloud installed locally (for manual deploys if needed)
	•	GitHub repo with:
	•	Dockerfile
	•	requirements.txt
	•	engine/startup_loader.py — FastAPI + Basic Auth (/, /status, /healthz)
	•	.github/workflows/deploy-cloudrun.yml — CI workflow for Cloud Run

The admin/status panel listens on port 8080, matching Cloud Run defaults.

1) What already exists in this repo

WebKurierCore/
├── Dockerfile
├── requirements.txt
├── engine/
│   └── startup_loader.py     # FastAPI app + basic-auth endpoints
└── .github/
    └── workflows/
        └── deploy-cloudrun.yml

2) One-time Google Cloud setup

Recommended EU regions:
	•	Cloud Run region: europe-west1 (Belgium) or europe-west4 (Netherlands)
	•	Artifact Registry location: same region as Cloud Run

Create Artifact Registry for Docker images:

gcloud artifacts repositories create webkurier \
  --repository-format=docker \
  --location=europe-west1 \
  --description="WebKurierCore images"

After that, the GitHub Actions workflow deploy-cloudrun.yml can:
	•	build the Docker image,
	•	push it to the webkurier Artifact Registry,
	•	deploy/update the Cloud Run service (HTTPS, autoscaling, no VM management),
	•	pass panel login/password as environment variables (not stored in Git).

⸻

RU

WebKurierCore — это центральная точка входа для пользователя и мозг-маршрутизатор всей AI-экосистемы (10 репозиториев).
Пользователь может выбрать узкую роль (математик, пилот, переводчик) либо расширенную модель SecondSelf (Второе Я), которая:
	•	опрашивает «совет директоров» из инженерных агентов,
	•	имитирует мимику, жесты, эмоции в 3D-интерфейсе кафе,
	•	помогает переводчику и автопилоту подсказками в realtime,
	•	создаёт консолидированный вывод или миноритарный отчет,
	•	при отключении интернета переходит в Lite-mode, без совета.

Где лежит AI-логика и агенты (Текущая структура)

WebKurierCore/
├── index.html                           ← портал выбора агентов (плитки)
├── admin/
│   ├── terminal.html                    ← терминал администратора
│   └── logs.html                        ← просмотр логов (опционально)
├── engine/
│   ├── config/
│   │   ├── agents_map.json              ← карта групп/маршрутов агентов
│   │   ├── entitlements.secondself.json ← тарифы и режимы SecondSelf
│   │   └── secrets.json                 ← токены/секреты (лежат только локально)
│   ├── api/                             ← внешние API-точки Core/Второго Я
│   │   ├── secondself_rest.py           ← REST  /secondself/query
│   │   └── secondself_ws.py             ← WebSocket /secondself/stream
│   ├── perception/                      ← wearable-сенсоры и потоки
│   │   ├── stereo_input_adapter.js      ← стерео-камеры (очки/клипса/шапка)
│   │   ├── mic_stream_adapter.js        ← микрофон (телефон/гарнитура)
│   │   └── translator_rt.js             ← realtime-перевод, субтитры и подсказки
│   ├── terminal/
│   │   ├── terminal_agent.js            ← терминал как «рука мозга»
│   │   └── commands_map.json            ← карта команд → к агентам (/pv roof, /call secondself, ...)
│   ├── agents/                          ← доменные HTML-ядра агентов
│   │   ├── geodesy/
│   │   │   └── geodesy-core.html
│   │   ├── drone/
│   │   │   └── drone-core.html
│   │   ├── autopilot/
│   │   │   └── autopilot-core.html
│   │   ├── pilot/
│   │   │   └── pilot-core.html
│   │   ├── geoviz3d/
│   │   │   └── geoviz3d-core.html
│   │   ├── pv-planner/
│   │   │   └── pv-planner-core.html
│   │   ├── geo-report/
│   │   │   └── geo-report-core.html
│   │   ├── translator/
│   │   │   └── translator-core.html
│   │   ├── voice/
│   │   │   └── voice-core.html
│   │   ├── phone/
│   │   │   └── phone-core.html
│   │   ├── lessons/
│   │   │   └── lessons-core.html
│   │   ├── wallet/
│   │   │   └── wallet-core.html
│   │   ├── accountant/
│   │   │   └── accountant-core.html
│   │   ├── tax-return/
│   │   │   └── tax-return-core.html
│   │   ├── hr/
│   │   │   └── hr-core.html
│   │   ├── marketing/
│   │   │   └── marketing-core.html
│   │   ├── romantic/
│   │   │   └── romantic-core.html
│   │   ├── engineer/
│   │   │   └── engineer-core.html
│   │   ├── programmer/
│   │   │   └── programmer-core.html
│   │   ├── designer/
│   │   │   └── designer-core.html
│   │   ├── editor/
│   │   │   └── editor-core.html
│   │   ├── tools/
│   │   │   └── tools-core.html
│   │   ├── dream/
│   │   │   └── dream-core.html
│   │   ├── security/
│   │   │   └── security-core.html
│   │   ├── legal/
│   │   │   └── legal-core.html
│   │   ├── memory/
│   │   │   └── memory-core.html
│   │   ├── admin-terminal/
│   │   │   └── admin-terminal-core.html
│   │   ├── master/
│   │   │   └── master-core.html
│   │   ├── second-self/                 ← Второе Я (совет агентов)
│   │   │   ├── second-self-core.html    ← интерфейс Второго Я
│   │   │   ├── secondself-agent.js      ← мозг-совет SecondSelf
│   │   │   ├── council_config.json      ← состав «совета директоров»
│   │   │   └── accelerators/
│   │   │       └── turbo_reasoning.js   ← ускоритель debate/консенсуса
│   │   └── cafe/                        ← кафе/пицца/бронь столов
│   │       └── cafe-core.html
│   └── js/
│       └── agents-menu.js               ← сборщик плиток агентов на портале
└── docs/
    └── *.html                           ← документация и страницы справки

Топология

Пользователь → Core → доменные ядра
(Инфраструктурные обновления и деплой запускает только Hybrid, без хранения токенов в GitHub.)

Реклама на голограмме (idle-режим)

Если клиент не взаимодействует с системой:
	•	на сайте/в кафе-интерфейсе крутится реклама: aerospace-3D, дроны, блюда, акции.

Если клиент подходит к голограмме:
	•	ядро SecondSelf переключается в режим диалогового шеф-повара/бариста,
	•	принимает заказ, включает STT/TTS/мимику, debate ON/OFF согласно тарифу.

⸻

DONE (Preserved — old tasks not lost!)
	•	Multi-language UI support (25+ langs)
	•	CI/CD orchestration defined on Hybrid level
	•	Specialist agent folders created
	•	SecondSelf roles conceptualized
	•	Entitlement tiers defined (Free/Lite/Enhanced/Premium/Trial)
	•	PV roof/field commands mapped
	•	Bots routed via Core (Telegram, WhatsApp, WebApp)
	•	iOS and Android cognitive linkage reserved

⸻

TODO (new tasks added)
	•	Implement /order.calendar infrastructure for cafe bookings and deliveries
	•	Bind /secondself/query authenticated routing to AI council aggregator
	•	Add wearable WebRTC QoS manager and policy guard for audio/video input
	•	Expose /portal status endpoint for traceable README task completion state
	•	Generate integrity hashes and log encrypted blocks into Chain
	•	Add ON/OFF cost-based council toggle persistence

⸻

Деплой в Google Cloud Run (EU, 5–10 минут)

Этот репозиторий подготовлен для деплоя Docker-образа на Google Cloud Run в регионе EU:
	•	автоскейлинг, HTTPS, без ручного управления VM;
	•	образ хранится в Artifact Registry;
	•	логин/пароль панели статуса передаются через переменные окружения (секреты не лежат в GitHub).

Предпосылки
	•	Есть проект GCP (Project ID).
	•	Установлен gcloud (для ручного деплоя при необходимости).
	•	В репозитории есть:
	•	Dockerfile
	•	requirements.txt
	•	engine/startup_loader.py — FastAPI + Basic-Auth (/, /status, /healthz)
	•	.github/workflows/deploy-cloudrun.yml — CI для Cloud Run

Панель слушает порт 8080, что совпадает с Cloud Run.

1) Что уже есть в репозитории

WebKurierCore/
├── Dockerfile
├── requirements.txt
├── engine/
│   └── startup_loader.py
└── .github/
    └── workflows/
        └── deploy-cloudrun.yml

2) Настройка Google Cloud (один раз)

Рекомендуемые EU-регионы:
	•	Cloud Run / Region: europe-west1 (Бельгия) или europe-west4 (Нидерланды)
	•	Artifact Registry / Location: тот же регион

Создание репозитория образов в Artifact Registry:

gcloud artifacts repositories create webkurier \
  --repository-format=docker \
  --location=europe-west1 \
  --description="WebKurierCore images"

Далее GitHub Actions (deploy-cloudrun.yml) может:
	•	собрать Docker-образ,
	•	отправить его в webkurier (Artifact Registry),
	•	задеплоить/обновить Cloud Run-сервис,
	•	передать логин/пароль панели через переменные окружения (секреты остаются вне GitHub).

---

Таким образом:

- Пути соединения (`index.html → engine/terminal → agents/...`) и конфиги теперь строго совпадают с твоей структурой.  
- Все агенты из списка `engine/agents/...` отражены в README.  
- Блок с Cloud Run аккуратно встроен и на EN, и на RU.  

