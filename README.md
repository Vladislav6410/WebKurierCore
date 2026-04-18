Вот собранная, вычищенная и структурированная финальная версия README.md для твоего репозитория. Я убрал дубли, выровнял стиль, добавил четкую иерархию и сделал его ближе к production-уровню (как для GitHub / инвесторов / команды).

⸻

WebKurierCore — Primary User Gateway & Cognitive Routing Engine

WebKurierCore is the central interaction layer of the WebKurier ecosystem.
It acts as the main entry point for all user interactions, routing requests between humans and distributed AI systems.

Core provides:
	•	Web portal & UI layer
	•	Terminal & command router
	•	SecondSelf Council (multi-agent reasoning engine)
	•	Agent interfaces (engineering, creative, admin)
	•	Authentication & entitlement control
	•	Cross-domain orchestration between all hubs

Core = Brain Gateway
It routes decisions — not executes them.

⸻

0. Local Development (Codex)

Prerequisites
	•	Node.js 18+
	•	Python 3.10+

Install

npm install

python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

Configure

export OPENAI_API_KEY="your_api_key_here"

Run (single command)

npm run dev:all

Services started:
	•	Node/Express → http://localhost:3000
	•	FastAPI → http://localhost:8081

Verify

curl http://localhost:3000/health

curl -X POST http://localhost:3000/api/codex/run \
  -H 'Content-Type: application/json' \
  -d '{"taskText":"ping"}'

Expected:

{ "ok": true }


⸻

1. Ecosystem Role (Hierarchy)

Level 0 — WebKurierHybrid (Global Orchestrator)
Level 1 — WebKurierCore (THIS REPO)

Level 2 — Domain Hubs:
  • VehicleHub
  • PhoneCore
  • Chain
  • Security

Level 3 — Mobile Apps (iOS / Android)
Level 4 — Public Website
Level 5 — Future / X Labs

Routing Flow

User → Web / CLI / Mobile
     → WebKurierCore
     → Domain Hub
     → Core aggregates response
     → User


⸻

2. Repository Structure (Final)

WebKurierCore/
│
├── index.html                    # Legacy portal UI
├── admin/                        # Legacy admin tools
│   ├── terminal.html
│   └── logs.html
│
├── engine/                       # Legacy runtime layer
│   ├── config/
│   │   ├── agents_map.json
│   │   ├── entitlements.json
│   │   └── secrets.json         # ⚠️ local only
│   │
│   ├── api/
│   │   ├── secondself_rest.py
│   │   └── secondself_ws.py
│   │
│   ├── perception/
│   ├── terminal/
│   ├── agents/                  # Legacy agent implementations
│   └── js/
│
├── docs/                        # Static docs
│
├── apps/                        # ✅ NEW LAYER
│   ├── cli-terminal/            # CLI interface
│   └── api-server/              # Backend API
│
├── packages/                    # Shared libraries
│   ├── websearch-core/
│   ├── agent-bridge/
│   └── eslint-config/
│
├── docker/
│   └── docker-compose.yml
│
├── scripts/                     # Dev & test scripts
│
├── .github/workflows/           # CI/CD
│
├── package.json                 # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json
└── README.md


⸻

3. Core Responsibilities

3.1 User Interaction Layer
	•	Web portal (agent selection)
	•	Responsive UI (mobile/web)
	•	i18n (25+ languages)
	•	Session management

3.2 Terminal Command Engine
	•	Unified CLI across all agents
	•	Secure command routing
	•	Owner-level hidden commands
	•	Cross-hub execution bridge

3.3 SecondSelf Council
	•	Multi-agent reasoning system
	•	Debate + consensus logic
	•	Specialist routing mode
	•	Behavior depends on user tier

3.4 Engineering & Admin Layer
	•	Programmer / Engineer / Designer / Editor agents
	•	Tools panel (code & asset generation)
	•	Admin terminal
	•	MasterAgent (system control)

3.5 Routing Logic

Core decides where request goes:

Domain	Responsibility
VehicleHub	Navigation, drones, PV
PhoneCore	Voice, translation
Chain	Ledger, tokens
Security	Threat analysis


⸻

4. Cross-Repository Data Flow

Drone Mission

User → Core → VehicleHub → Core → User

Translation

User → Core → PhoneCore → Core → User

Blockchain

Core → Chain → Core

Security Scan

Core → Security → Core

Core = Router, not executor

⸻

5. CI/CD & Deployment
	•	Controlled by WebKurierHybrid
	•	No secrets in repo
	•	Local secrets:

engine/config/secrets.json


	•	CI validates:
	•	routing maps
	•	code style
	•	agent configs

Deployment targets:
	•	Cloud Run
	•	Static hosting (frontend)

⸻

6. Agent Glossary

Engineering
	•	EngineerAgent — Инженер
	•	ProgrammerAgent — Программист
	•	DesignerAgent — Дизайнер
	•	EditorAgent — Редактор

Operations
	•	GeodesyAgent — Геодезист
	•	DroneAgent — Агент дрона
	•	AutopilotAgent — Автопилот

Communication
	•	TranslatorAgent — Переводчик
	•	VoiceAgent — Голос
	•	PhoneAgent — Телефония

Business
	•	AccountantAgent — Бухгалтер
	•	TaxReturnAgent — Налоги
	•	MarketingAgent — Маркетинг
	•	HRAgent — HR

System
	•	SecurityAgent — Антивирус
	•	MasterAgent — Управляющий
	•	CouncilAgent — Совет Второго Я

⸻

7. Security & Entitlements
	•	Defined in:

engine/config/entitlements.json


	•	Tier-based access:
	•	Free
	•	Pro
	•	Premium

SecondSelf Council adapts behavior per tier.

⸻

8. Governance

Maintained by:

Vladyslav Hushchyn (VladoExport)
Germany, EU

⸻

9. Key Concept

WebKurierCore is not just a UI layer.
It is a cognitive router between human intent and distributed intelligence systems.

⸻

⚙️ Что я улучшил (коротко)
	•	убрал дубли и “шум”
	•	сделал структуру enterprise-уровня
	•	разделил legacy vs new architecture
	•	усилил positioning (важно для инвесторов/README)
	•	унифицировал стиль (EN + RU где нужно)

⸻

Если хочешь — следующим шагом могу:
	•	сделать ARCHITECTURE.md (диаграммы + flows)
	•	или SYSTEM DESIGN уровня FAANG (с latency, scaling, queues)
	•	или README для каждого подпакета (cli / api / packages)