# WebKurierCore — Primary User Gateway & Cognitive Routing Engine
WebKurierCore is the main entry point for all user interactions across the WebKurier ecosystem. It provides the Web portal, agent selection interface, terminal environment, SecondSelf Council routing, and cross-domain orchestration between VehicleHub, PhoneCore, Chain, and Security.
Core is responsible for:
	•	User-facing UI (web)
	•	Terminal and command router
	•	SecondSelf Council reasoning engine
	•	Engineering & creative agent interfaces
	•	Administration panels
	•	Authentication and entitlement logic
	•	Linking user inputs to appropriate domain hubs
This repository is the central interaction layer between human users and machine intelligence.

# 0. Local Development (Codex)
Prerequisites
	•	Node.js 18+
	•	Python 3.10+
Install
npm install
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
Configure
Set required environment variables before running the Codex API route:
export OPENAI_API_KEY="your_api_key_here"
Run (single command)
npm run dev:all
This starts:
	•	Node/Express server at http://localhost:3000
	•	FastAPI backend at http://localhost:8081
Verify endpoints
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/codex/run \
  -H 'Content-Type: application/json' \
  -d '{"taskText":"ping"}'
Expected responses:
	•	GET /health → { "ok": true }
	•	POST /api/codex/run → { "ok": true, "output_text": "..." }
1. Role in the Ecosystem (Hierarchy Level 1)

Level 0 — WebKurierHybrid (orchestrator)
Level 1 — WebKurierCore (THIS REPOSITORY)
Level 2 — Domain Hubs:
   • WebKurierVehicleHub
   • WebKurierPhoneCore
   • WebKurierChain
   • WebKurierSecurity
Level 3 — Mobile Apps (iOS/Android)
Level 4 — Public Site
Level 5 — Future/X Labs

# WebKurierCore acts as the global router:

User → Web / Bots / Mobile
     → WebKurierCore (Gateway)
     → Domain Hub (VehicleHub / PhoneCore / Chain / Security)
     → Core returns unified answer (text, voice, media)


⸻

# 2. Repository Structure (High-Level)
WebKurierCore/
├── index.html                               # Legacy main portal (tiles)
├── admin/
│   ├── terminal.html                        # Legacy admin terminal UI
│   └── logs.html                            # Legacy logs viewer
│
├── engine/                                  # Legacy runtime / UI layer
│   ├── config/
│   │   ├── agents_map.json                  # Agent groups & routing map
│   │   ├── entitlements.json                # Access tiers & roles
│   │   └── secrets.json                     # Local-only secrets (not in git)
│   │
│   ├── api/
│   │   ├── secondself_rest.py               # Legacy REST endpoint
│   │   └── secondself_ws.py                 # Legacy WS endpoint
│   │
│   ├── perception/
│   │   ├── stereo_input_adapter.js
│   │   ├── mic_stream_adapter.js
│   │   └── translator_rt.js
│   │
│   ├── terminal/
│   │   ├── terminal_agent.js
│   │   └── commands_map.json
│   │
│   ├── agents/
│   │   ├── geodesy/
│   │   ├── drone/
│   │   ├── autopilot/
│   │   ├── pilot/
│   │   ├── geoviz3d/
│   │   ├── pv-planner/
│   │   ├── geo-report/
│   │   ├── translator/
│   │   ├── voice/
│   │   ├── phone/
│   │   ├── lessons/
│   │   ├── wallet/
│   │   ├── accountant/
│   │   ├── tax-return/
│   │   ├── hr/
│   │   ├── marketing/
│   │   ├── romantic/
│   │   ├── engineer/
│   │   │   ├── engineer-agent.js
│   │   │   ├── engineer-config.json
│   │   │   ├── prompts/
│   │   │   │   └── engineer-system.prompt.txt
│   │   │   ├── ui/
│   │   │   │   ├── engineer-core.html
│   │   │   │   └── engineer-ui.js
│   │   │   ├── api/
│   │   │   │   └── engineer-api.js
│   │   │   └── README.md
│   │   ├── programmer/
│   │   ├── designer/
│   │   ├── editor/
│   │   ├── tools/
│   │   ├── dream/
│   │   ├── security/                        # Legacy security agent UI/runtime
│   │   ├── legal/
│   │   ├── memory/
│   │   ├── admin-terminal/
│   │   ├── master/
│   │   ├── second-self/
│   │   └── cafe/
│   │
│   └── js/
│       └── agents-menu.js
│
├── docs/
│   └── *.html
│
├── apps/                                    # New application layer
│   ├── cli-terminal/                        # ✅ CLI shell for search/repo/agent
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── commands/
│   │       │   ├── search.ts
│   │       │   ├── config.ts
│   │       │   ├── doctor.ts
│   │       │   ├── agent.ts
│   │       │   └── repo.ts
│   │       ├── lib/
│   │       │   ├── config/
│   │       │   │   ├── EnvLoader.ts
│   │       │   │   └── CliConfig.ts
│   │       │   ├── diagnostics/
│   │       │   │   └── HealthReport.ts
│   │       │   ├── interactive/
│   │       │   │   ├── PromptEngine.ts
│   │       │   │   └── Spinner.ts
│   │       │   └── output/
│   │       │       ├── PrettyFormatter.ts
│   │       │       ├── JsonFormatter.ts
│   │       │       ├── TableFormatter.ts
│   │       │       └── MarkdownFormatter.ts
│   │       └── utils/
│   │           └── exitCodes.ts
│   │
│   └── api-server/                          # ✅ Backend API layer
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       ├── Dockerfile
│       └── src/
│           ├── index.ts
│           ├── app.ts
│           ├── routes/
│           │   ├── health.ts
│           │   └── agent.ts                # POST /api/v1/agent/security
│           ├── middleware/
│           │   ├── errorHandler.ts
│           │   ├── requestLogger.ts
│           │   └── rateLimit.ts
│           └── utils/
│               └── logger.ts
│
├── packages/                                # New shared packages
│   ├── websearch-core/                      # ✅ OpenAI/Web Search client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── WebSearchClient.ts
│   │       └── types/
│   │           ├── SearchMode.ts
│   │           └── SearchConfig.ts
│   │
│   ├── agent-bridge/                        # ✅ Shared agent adapters
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── SecurityAgent/
│   │           ├── index.ts
│   │           ├── SecuritySearchAdapter.ts
│   │           ├── types/
│   │           │   └── SecurityCheck.ts
│   │           ├── services/
│   │           │   ├── UrlSanitizer.ts
│   │           │   ├── RiskCalculator.ts
│   │           │   ├── CacheManager.ts
│   │           │   ├── RedisCacheManager.ts
│   │           │   └── ReputationAggregator.ts
│   │           └── utils/
│   │               └── domain-parser.ts
│   │
│   └── eslint-config/                       # optional shared config package
│       └── package.json
│
├── docker/
│   ├── docker-compose.yml
│   └── .env.example
│
├── scripts/
│   ├── test-cli.sh
│   ├── test-security-agent.sh
│   ├── seed-demo.sh
│   ├── seed-threat-samples.sh
│   └── deploy.sh
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── deploy.yml
│       ├── security.yml
│       ├── pages.yml
│       └── update-modes.yml
│
├── .gitignore
├── .env                                     # local only, not in git
├── package.json                             # root monorepo
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md

⸻

# 3. Core Responsibilities

3.1. User Interaction Layer
	•	Agent selection portal (index.html)
	•	i18n support (25+ languages)
	•	Mobile/Web adaptive layouts
	•	Secure session flow

3.2. Terminal Command Engine
	•	Unified CLI for all agents
	•	Owner-level commands (not stored in repo)
	•	Integration with VehicleHub mission commands, PhoneCore translation/voice, Chain ledger, Security scanner

3.3. SecondSelf Council
	•	High-level multi-agent reasoning
	•	Debate accelerators
	•	Consensus or specialist-mode routing
	•	Adjustable by entitlement tier

3.4. Engineering & Admin Agents
	•	Programmer, Engineer, Designer, Editor
	•	Tools panel (HTML/ZIP generators)
	•	Admin terminal
	•	MasterAgent (system-level control)

3.5. System Routing

# WebKurierCore makes the decision:

Does the task belong to:
• VehicleHub (navigation, geodesy, PV, missions)?
• PhoneCore (translation, voice, chats, telephony)?
• Chain (ledgers, tokens, integrity)?
• Security (scan, validation)?


⸻

# 4. Cross-Repository Data Flow

Example: Drone Request

User → Core Terminal → VehicleHub/autopilot → Core → User

Example: Translation Request

User → Core Portal → PhoneCore/translator → Core → User

Example: Blockchain Transaction

Core → Chain → Core

Example: Security Scan

Core → SecurityAgent → Core

Core is the router, not the executor.

⸻

# 5. CI/CD Integration
	•	Core builds are initiated via Hybrid
	•	No secrets stored in this repository
	•	Local-only secrets in engine/config/secrets.json
	•	Frontend build optimized for Cloud Run & static hosting
	•	Code style and routing maps validated during CI

⸻

# 6. Agent Glossary (EN + RU translation only)

GeodesyAgent — Геодезист
DroneAgent — Агент дрона
AutopilotAgent — Автопилот
PilotAgent — Пилот
GeoViz3DAgent — Гео-визуализатор 3D
PVPlannerAgent — ПВ-планировщик
GeoReportAgent — Генератор геоотчётов

TranslatorAgent — Переводчик
VoiceAgent — Голосовой ассистент
PhoneAgent — Телефония
LessonsAgent — Уроки A1–C1
RomanticAgent — Романтический собеседник
HRAgent — HR-агент
MarketingAgent — Маркетолог
MemoryAgent — Память
DreamAgent — Генератор медиа
CafeAgent — Кафе/меню/бронь
WalletAgent — WebCoin-кошелёк

EngineerAgent — Инженер
ProgrammerAgent — Программист
DesignerAgent — Дизайнер
EditorAgent — Редактор
ToolsAgent — Панель инструментов
MasterAgent — Управляющий
AdminTerminalAgent — Админ-терминал

AccountantAgent — Бухгалтер
TaxReturnAgent — Налоговая декларация
LegalAgent — Юрист

SecurityAgent — Антивирус/антифишинг
CouncilAgent (SecondSelf) — Совет Второго Я


⸻

# 7. Security & Entitlements
	•	Access levels defined in entitlements.json
	•	Sensitive actions require elevated role
	•	SecondSelf Council behavior changes per tier (Free → Premium)

⸻

# 8. Contact & Governance

WebKurierCore is maintained by
Vladyslav Hushchyn (VladoExport)
Germany, EU.

⸻
