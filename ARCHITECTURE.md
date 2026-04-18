# ARCHITECTURE.md

Внутри него должны быть такие разделы:
	•	1. Purpose
	•	2. System Position in WebKurier Ecosystem
	•	3. High-Level Architecture
	•	4. Legacy Layer vs New Modular Layer
	•	5. Request Routing Model
	•	6. SecondSelf Council Flow
	•	7. Cross-Repository Communication
	•	8. Security Boundaries
	•	9. Entitlements and Access Control
	•	10. Deployment View
	•	11. Future Migration Path

И туда же стоит добавить 4 ключевые диаграммы в Mermaid:
	•	ecosystem hierarchy
	•	internal repository architecture
	•	request routing flow
	•	cross-repo interaction flow

Ниже — готовый каркас, который уже можно класть в ARCHITECTURE.md.

⸻

ARCHITECTURE.md

# WebKurierCore Architecture

## 1. Purpose

WebKurierCore is the central gateway of the WebKurier ecosystem.  
It is responsible for receiving user input, identifying intent, applying entitlement and routing logic, and delegating execution to the appropriate domain hub or internal agent layer.

WebKurierCore is primarily a **cognitive routing and interaction system**, not the final execution engine for domain-specific tasks.

---

## 2. Position in the Ecosystem

WebKurierCore sits directly below the global orchestrator and directly above all domain hubs.

```mermaid
flowchart TD
    A[WebKurierHybrid<br/>Global Orchestrator] --> B[WebKurierCore<br/>Gateway & Cognitive Router]

    B --> C[WebKurierVehicleHub]
    B --> D[WebKurierPhoneCore]
    B --> E[WebKurierChain]
    B --> F[WebKurierSecurity]

    C --> G[Mobile Apps]
    D --> G
    E --> G
    F --> G

    B --> H[Public Website]
    B --> I[Future / X Labs]

Hierarchy
	•	Level 0 — WebKurierHybrid
	•	Level 1 — WebKurierCore
	•	Level 2 — Domain Hubs
	•	Level 3 — Mobile Apps
	•	Level 4 — Public Website
	•	Level 5 — Future / X Labs

⸻

3. Architectural Role

WebKurierCore provides:
	•	user-facing web interaction layer
	•	terminal / command layer
	•	multi-agent reasoning via SecondSelf Council
	•	access control and entitlement enforcement
	•	internal and external routing logic
	•	unified response aggregation

It does not own all domain execution logic.
Instead, it decides where work should be processed and returns a unified result to the user.

⸻

4. High-Level Internal Architecture

The repository consists of two major layers:
	1.	Legacy runtime/UI layer under engine/
	2.	New modular application layer under apps/ and packages/

flowchart TB
    U[User Input] --> W[Web Portal / CLI / API]
    W --> R[Routing Layer]
    R --> C[SecondSelf Council]
    R --> A[Agent Interfaces]
    R --> E[Entitlements / Auth]
    R --> D[Domain Hub Dispatch]

    D --> VH[VehicleHub]
    D --> PH[PhoneCore]
    D --> CH[Chain]
    D --> SH[Security]

    A --> L[Legacy engine/ agents]
    A --> N[New apps/ + packages/ modules]


⸻

5. Repository Layers

5.1 Legacy Layer

The legacy layer is located mainly in:
	•	index.html
	•	admin/
	•	engine/
	•	docs/

This layer contains:
	•	older portal pages
	•	admin terminal interfaces
	•	historical runtime logic
	•	direct agent UI implementations
	•	local config-based routing

5.2 New Modular Layer

The new architecture is centered around:
	•	apps/cli-terminal
	•	apps/api-server
	•	packages/websearch-core
	•	packages/agent-bridge

This layer introduces:
	•	clearer boundaries
	•	reusable packages
	•	monorepo-friendly development
	•	typed interfaces
	•	better CI/CD integration
	•	future-ready service separation

⸻

6. Request Lifecycle

A typical request through WebKurierCore follows this path:

sequenceDiagram
    participant User
    participant Core as WebKurierCore
    participant Route as Routing Engine
    participant Council as SecondSelf Council
    participant Hub as Domain Hub / Agent
    participant Response as Unified Response Layer

    User->>Core: Submit request
    Core->>Route: Parse intent + validate session
    Route->>Route: Check entitlements
    Route->>Council: Optional reasoning / deliberation
    Council-->>Route: Routing recommendation
    Route->>Hub: Forward task
    Hub-->>Response: Return domain result
    Response-->>Core: Normalize output
    Core-->>User: Final response

Lifecycle Stages
	1.	Input received
	2.	Identity / session validated
	3.	Entitlements checked
	4.	Intent classified
	5.	Optional council reasoning
	6.	Domain routing
	7.	Domain execution
	8.	Response normalization
	9.	Final delivery

⸻

7. Routing Model

WebKurierCore decides whether a request belongs to:
	•	VehicleHub — navigation, geodesy, drone control, autopilot, PV planning
	•	PhoneCore — translation, voice, telephony, dialogue
	•	Chain — ledger, token, transaction, integrity workflows
	•	Security — scan, validation, anti-phishing, trust checks
	•	Internal agents — engineering, creative, admin, planning, memory, tools

Example Routing Logic

Request Type	Routed To
Drone route planning	VehicleHub
Live translation	PhoneCore
Wallet / token operation	Chain
URL scan / phishing check	Security
Code generation	ProgrammerAgent
Systems design task	EngineerAgent
Admin control command	AdminTerminal / MasterAgent


⸻

8. SecondSelf Council

SecondSelf Council is the high-level reasoning layer of WebKurierCore.

It supports:
	•	multi-agent debate
	•	specialist recommendation
	•	consensus generation
	•	task escalation
	•	tier-sensitive reasoning depth

Council Modes
	•	Direct routing mode — fast dispatch without debate
	•	Consensus mode — multiple agents evaluate the task
	•	Specialist mode — one expert agent selected
	•	Escalation mode — elevated routing for admin or sensitive actions

Council Responsibilities
	•	resolve ambiguous user intent
	•	choose best agent or domain hub
	•	aggregate multi-perspective reasoning
	•	adapt depth by entitlement tier

⸻

9. Cross-Repository Communication

WebKurierCore is the front router for the broader platform.

flowchart LR
    U[User] --> C[WebKurierCore]

    C --> V[VehicleHub]
    C --> P[PhoneCore]
    C --> B[Chain]
    C --> S[Security]

    V --> C
    P --> C
    B --> C
    S --> C

    C --> U

Examples

Drone Request
User → Core → VehicleHub → Core → User

Translation Request
User → Core → PhoneCore → Core → User

Blockchain Request
User → Core → Chain → Core → User

Security Check
User → Core → Security → Core → User

⸻

10. Security Boundaries

Security decisions in WebKurierCore are enforced at multiple levels:
	•	authentication
	•	entitlement tier
	•	role-sensitive command restrictions
	•	local secret isolation
	•	admin-only surfaces
	•	secure routing for sensitive operations

Key Rules
	•	no production secrets in Git
	•	local-only secrets stored outside shared source control
	•	elevated actions require privileged roles
	•	sensitive task routing can be hardened by policy
	•	security scanning is delegated to Security domain components where applicable

⸻

11. Entitlements

Entitlements are defined in:
	•	engine/config/entitlements.json

They influence:
	•	agent access
	•	tool availability
	•	council depth
	•	admin visibility
	•	premium workflow access

Example Tier Behavior
	•	Free — limited routing, minimal council depth
	•	Pro — broader tool access, stronger reasoning
	•	Premium — full council behavior, specialist routing, elevated workflows

⸻

12. Repository Structure Overview

WebKurierCore/
├── index.html
├── admin/
├── engine/
├── docs/
├── apps/
│   ├── cli-terminal/
│   └── api-server/
├── packages/
│   ├── websearch-core/
│   ├── agent-bridge/
│   └── eslint-config/
├── docker/
├── scripts/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md

Architectural Meaning
	•	engine/ = legacy execution and UI artifacts
	•	apps/ = deployable application surfaces
	•	packages/ = shared reusable logic
	•	scripts/ = developer and ops automation
	•	.github/workflows/ = CI/CD enforcement

⸻

13. Deployment View

WebKurierCore is designed to support:
	•	local development
	•	containerized deployment
	•	static frontend hosting
	•	Cloud Run compatible backend deployment
	•	CI-driven validation and release flow

Deployment Components
	•	web frontend
	•	API server
	•	optional Python backend
	•	shared package builds
	•	external domain hub integrations

⸻

14. Migration Direction

The long-term direction is a gradual transition from the legacy runtime layer to the modular monorepo structure.

Migration Goals
	•	move critical runtime paths into typed packages
	•	separate UI from routing logic
	•	reduce direct legacy coupling
	•	standardize agent interfaces
	•	enforce shared contracts across hubs
	•	simplify deployment and observability

Target State

WebKurierCore becomes:
	•	a stable gateway
	•	a typed orchestration layer
	•	a unified interface for user interaction
	•	a policy-aware router across all WebKurier systems

⸻

15. Summary

WebKurierCore is the primary human-to-system gateway in the WebKurier ecosystem.

Its core function is to:
	•	receive input
	•	understand intent
	•	enforce policy
	•	choose the right destination
	•	return a unified result

It is the central routing intelligence layer between users and distributed machine capabilities.

---

Следующий шаг после этого — уже **SYSTEM_DESIGN.md**, где я бы разложил:

- API boundary
- sync vs async flows
- queue strategy
- cache strategy
- rate limits
- observability
- audit logging
- multi-tenant access
- scaling profile for Council
- failover between hubs

Сильнее всего сейчас будет сделать именно **ARCHITECTURE.md**, а потом поверх него собрать **SYSTEM DESIGN уровня FAANG**.