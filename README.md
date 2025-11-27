# WebKurierCore — Intelligent User Gateway & Cognitive AI Council

[Ubuntu 22.04](chatgpt://generic-entity?number=0) VM/server hosts live execution of the services.
This repository is managed by the infrastructure layer of [CI/CD](chatgpt://generic-entity?number=1) but contains heavy domain AI and routing logic for users.

---

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

### Primary Local Paths

WebKurierCore/
└── engine/
├── config/
│   ├── agents.registry.json                # registry of all domain agents + council weights
│   ├── entitlements.secondself.json       # entitlements and premium/lite/trial tiers
│   └── secrets.json                       # token placeholders, local only
├── api/
│   ├── secondself_rest.py                # POST /secondself/query
│   └── secondself_ws.py                  # WS /secondself/stream
├── perception/
│   ├── stereo_input_adapter.js           # stereo wearable cameras adapter
│   ├── mic_stream_adapter.js             # microphone chunks handler
│   └── translator_rt.js                  # real-time translation (text/voice subtitles + council advice proxy)
├── terminal/
│   ├── terminal_agent.js                 # CLI router + owner commands
│   └── commands_map.json                # terminal command registry
└── agents/
├── second-self/
│   ├── secondself-agent.js           # council invocation brain
│   ├── council_config.json            # agent council composition
│   └── accelerators/turbo_reasoning.js # debate & consensus optimizer
├── cafe/
│   ├── order.calendar.js              # booking + delivery + menu scheduler
│   └── pizza_order_core.js           # direct pizza/menu orders
├── geodesy/
├── drone/
├── wallet/
├── accountant/
├── legal/
├── hr/
└── marketing/

### Cross-Repository Cognitive Flow

User → index.html (portal) → Terminal/PhoneCore/WebRTC input
→ Core Decision Router + optional SecondSelf council
→ Domain hub (DroneHybrid / Chain / Security / PhoneCore)
→ AI response delivered by core (text or TTS voice)

---

## RU

**WebKurierCore** — это **центральная точка входа для пользователя** и **мозг-маршрутизатор** всей AI-экосистемы (10 репозиториев).  
Пользователь может выбрать узкую роль (математик, пилот, переводчик), либо расширенную модель **SecondSelf (Второе Я)**, которая:

- опрашивает «совет директоров» из инженерных агентов,
- имитирует мимику, жесты, эмоции в 3D интерфейсе кафе,
- помогает переводчику и автопилоту подсказками в realtime,
- создаёт **консолидированный вывод** или **миноритарный отчет**,  
- при отключении интернета — **переходит в Lite-mode**, без совета.

### Где лежит AI-логика и агенты

WebKurierCore/
└── engine/
├── config/
│   ├── agents.registry.json          # реестр специалистов + веса совета
│   ├── entitlements.secondself.json # уровни доступа и режимы
│   └── secrets.json                 # шаблон для токенов, локально на VM
├── api/                             # внешние API-точки Второго Я
│   ├── secondself_rest.py
│   └── secondself_ws.py
├── perception/                       # wearable-сенсоры
│   ├── stereo_input_adapter.js       # стерео-камеры (очки, грудь, шапка)
│   ├── mic_stream_adapter.js         # микрофон
│   └── translator_rt.js              # realtime-перевод, субтитры и подсказки
├── terminal/
│   ├── terminal_agent.js             # терминал как «рука мозга»
│   └── commands_map.json             # registry команд → к агентам
└── agents/                           # доменные агенты
├── second-self/                  # Второе Я
│   ├── secondself-agent.js
│   ├── council_config.json
│   └── accelerators/turbo_reasoning.js
├── cafe/                         # кафе и заказы (меню, стол, доставка)
│   ├── order.calendar.js
│   └── pizza_order_core.js
├── geodesy/
├── drone/
├── wallet/
├── accountant/
├── legal/
├── hr/
└── marketing/

### Топология

Пользователь → Core → доменные ядра
(Инфраструктурные обновления запускает только Hybrid, без хранения токенов в GitHub)

### Реклама на голограмме (idle-режим)
Если клиент не взаимодействует с системой:  
- на сайте/кафе UI показывается реклама: aerospace 3D, дроны, блюда, акции.  
Если клиент подходит к голограмме:
- ядро SecondSelf меняется в **диалогового шеф-повара/бариста**, принимает заказ, включает STT/TTS/мимику, debate ON/OFF, согласно тарифу.

---

## DONE (Preserved — old tasks not lost!)
- Multi-language UI support (25+ langs)
- CICD orchestration defined on Hybrid level
- Specialist agents folders created
- SecondSelf roles conceptualized
- Entitlement tiers defined (Free/Lite/Enhanced/Premium/Trial)
- PV roof/field commands mapped
- Bots routed via Core (Telegram, WhatsApp, WebApp)
- iOS and Android cognitive linkage reserved

---

## TODO (new tasks added)
- Implement `/order.calendar` infrastructure for cafe bookings and deliveries
- Bind `/secondself/query` authenticated routing to AI council aggregator
- Add wearable WebRTC QoS manager and policy guard for audio/video input
- Expose `/portal status` endpoint for traceable README task completion state
- Generate integrity hashes and log encrypted blocks into Chain
- Add ON/OFF cost-based council toggle persistence