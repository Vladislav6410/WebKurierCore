Ниже — готовый следующий пакет: docs/API_SPEC.md, docs/AGENTS_SPEC.md, docs/COUNCIL.md. Он согласован с README.md, ARCHITECTURE.md, ROUTING.md и SECURITY.md.

⸻

docs/API_SPEC.md

# WebKurierCore API Specification

## 1. Purpose

This document defines the public and internal API surface of WebKurierCore.

The API is responsible for:
- receiving user and system requests
- validating access
- routing tasks to the correct domain or internal agent
- returning a normalized response

---

## 2. Design Principles

- versioned endpoints
- consistent request/response envelopes
- explicit error model
- separation between public and privileged APIs
- routing-first design

---

## 3. Base Conventions

### Base Path

```text
/api/v1

Content Type

Content-Type: application/json

Response Envelope

{
  "ok": true,
  "request_id": "req_123",
  "route": "security",
  "mode": "sync",
  "data": {},
  "meta": {}
}

Error Envelope

{
  "ok": false,
  "request_id": "req_123",
  "error": {
    "code": "ACCESS_DENIED",
    "message": "User tier does not allow this action"
  }
}


⸻

4. Authentication Context

Each authenticated request should resolve:
	•	user ID
	•	role
	•	entitlement tier
	•	session or token context

Admin endpoints require elevated privileges.

⸻

5. Endpoints

5.1 Health

GET /health

Returns service status.

Response

{
  "ok": true
}


⸻

5.2 Route Request

POST /api/v1/route

Main routing endpoint for user tasks.

Request

{
  "task": "Scan this URL",
  "input": {
    "url": "https://example.com"
  },
  "options": {
    "mode": "auto",
    "language": "en"
  }
}

Response

{
  "ok": true,
  "request_id": "req_001",
  "route": "security",
  "mode": "sync",
  "data": {
    "result": "safe"
  },
  "meta": {
    "agent": "SecurityAgent"
  }
}


⸻

5.3 Direct Agent Invocation

POST /api/v1/agent/:agentId

Invokes a specific internal or bridged agent.

Example

POST /api/v1/agent/programmer

Request

{
  "task": "Generate a TypeScript utility",
  "input": {
    "goal": "Parse domain names"
  }
}


⸻

5.4 Council Evaluation

POST /api/v1/council/evaluate

Requests SecondSelf Council reasoning.

Request

{
  "task": "Which domain should handle this workflow?",
  "context": {
    "user_tier": "premium",
    "input_type": "multi-domain"
  }
}

Response

{
  "ok": true,
  "request_id": "req_002",
  "route": "council",
  "mode": "sync",
  "data": {
    "decision": "VehicleHub",
    "reasoning_mode": "specialist"
  }
}


⸻

5.5 Admin Command

POST /api/v1/admin/command

Restricted endpoint for privileged commands.

Request

{
  "command": "refresh-routing-map",
  "params": {}
}

Notes
	•	admin-only
	•	must be audited
	•	may require stronger authentication

⸻

6. Route Modes

Supported routing modes:
	•	auto — system decides
	•	direct — direct routing when known
	•	council — force council evaluation
	•	async — queue long-running task

⸻

7. Status Codes

Code	Meaning
200	success
202	accepted for async processing
400	invalid request
401	unauthenticated
403	forbidden
404	route or agent not found
409	conflict or duplicate operation
429	rate limit exceeded
500	internal error
503	downstream unavailable


⸻

8. Error Codes

Error Code	Meaning
INVALID_INPUT	malformed request
ACCESS_DENIED	entitlement or role restriction
AGENT_NOT_FOUND	unknown agent
ROUTE_NOT_AVAILABLE	route disabled or unavailable
HUB_TIMEOUT	downstream hub timed out
RATE_LIMITED	request budget exceeded
INTERNAL_ERROR	unexpected server error


⸻

9. Async Pattern

Long-running requests may return:

{
  "ok": true,
  "request_id": "req_003",
  "mode": "async",
  "data": {
    "job_id": "job_123"
  }
}

Suggested follow-up endpoint:

GET /api/v1/jobs/:jobId


⸻

10. API Boundaries

Public API
	•	route requests
	•	agent access
	•	health checks

Internal API
	•	service-to-service routing
	•	bridge adapters
	•	operational hooks

Admin API
	•	privileged commands
	•	policy inspection
	•	operational overrides

⸻

11. Versioning

Rules:
	•	external APIs must be versioned
	•	breaking changes require new version
	•	internal contracts should also be explicitly tracked

⸻

12. Summary

The WebKurierCore API is designed to be:
	•	simple
	•	versioned
	•	routing-centric
	•	secure
	•	consistent across domains

---

## `docs/AGENTS_SPEC.md`

```markdown
# WebKurierCore Agents Specification

## 1. Purpose

This document defines the role, contract, and expected behavior of agents used by WebKurierCore.

Agents may be:
- internal agents
- bridged agents
- domain-facing adapters
- reasoning participants in SecondSelf Council

---

## 2. Agent Categories

### Domain-Facing
- SecurityAgent
- Vehicle-oriented agents
- Phone / translation agents
- Chain-related adapters

### Engineering & Creative
- EngineerAgent
- ProgrammerAgent
- DesignerAgent
- EditorAgent
- ToolsAgent

### System & Control
- AdminTerminalAgent
- MasterAgent
- CouncilAgent
- MemoryAgent

---

## 3. Common Agent Contract

Each agent should define:

- `id`
- `name`
- `purpose`
- `input schema`
- `output schema`
- `capabilities`
- `limitations`
- `routing hooks`
- `entitlement requirements`

---

## 4. Standard Agent Interface

## Input Shape

```json
{
  "task": "string",
  "input": {},
  "context": {
    "user_id": "user_123",
    "tier": "pro",
    "language": "en"
  }
}

Output Shape

{
  "ok": true,
  "agent": "ProgrammerAgent",
  "result": {},
  "meta": {
    "mode": "direct"
  }
}


⸻

5. Agent Requirements

All agents should:
	•	accept structured input
	•	return normalized output
	•	avoid leaking secrets or internal state
	•	respect entitlement restrictions
	•	support auditability for sensitive actions
	•	fail predictably

⸻

6. Agent Catalog

6.1 EngineerAgent

Purpose:
System design, architecture, technical planning.

Capabilities:
	•	architecture guidance
	•	infrastructure reasoning
	•	design breakdowns
	•	implementation planning

Typical Inputs:
	•	architecture questions
	•	scaling strategy
	•	backend planning

Typical Outputs:
	•	structured plans
	•	design decisions
	•	architecture notes

⸻

6.2 ProgrammerAgent

Purpose:
Code generation, debugging, refactoring, implementation support.

Capabilities:
	•	generate code
	•	explain logic
	•	propose fixes
	•	support repository changes

Typical Inputs:
	•	feature requests
	•	bug reports
	•	code modification tasks

Typical Outputs:
	•	code snippets
	•	implementation plans
	•	patch guidance

⸻

6.3 DesignerAgent

Purpose:
UI, UX, interface structure, visual system guidance.

Capabilities:
	•	layout suggestions
	•	component structure
	•	UX improvements
	•	design system recommendations

⸻

6.4 EditorAgent

Purpose:
Text refinement, structure, documentation editing.

Capabilities:
	•	rewrite
	•	format
	•	improve clarity
	•	maintain documentation quality

⸻

6.5 ToolsAgent

Purpose:
Utility operations and helper workflows.

Capabilities:
	•	structured generators
	•	packaging helpers
	•	asset-oriented tooling

⸻

6.6 SecurityAgent

Purpose:
Threat evaluation, phishing detection, URL validation, risk scoring.

Capabilities:
	•	URL safety checks
	•	domain parsing
	•	reputation aggregation
	•	risk calculation

Notes:
	•	may use cached or external reputation signals
	•	must return risk-oriented output

⸻

6.7 CouncilAgent

Purpose:
Participates in SecondSelf Council reasoning.

Capabilities:
	•	evaluate ambiguity
	•	compare route candidates
	•	recommend specialist or consensus path

⸻

6.8 AdminTerminalAgent

Purpose:
Restricted administrative workflows.

Capabilities:
	•	operational commands
	•	system inspection
	•	privileged control actions

Restrictions:
	•	elevated role required
	•	fully audited

⸻

7. Routing Hooks

Each agent may declare:
	•	supported intents
	•	supported domains
	•	complexity profile
	•	whether council is required or optional
	•	whether async execution is preferred

Example:

{
  "agent": "SecurityAgent",
  "supports": ["scan", "validate", "risk-check"],
  "mode": ["sync", "async"],
  "tier_required": "free"
}


⸻

8. Entitlements

Agents may be:
	•	public
	•	authenticated-only
	•	pro/premium
	•	admin-only

Routing must enforce these constraints before invocation.

⸻

9. Failure Behavior

Agents should fail with:
	•	explicit error code
	•	predictable shape
	•	no secret leakage
	•	no raw internal stack output

⸻

10. Summary

WebKurierCore agents are modular execution or reasoning units that:
	•	receive structured input
	•	operate under routing and entitlement control
	•	return normalized output
	•	remain replaceable behind stable contracts

---

## `docs/COUNCIL.md`

```markdown
# WebKurierCore SecondSelf Council

## 1. Purpose

SecondSelf Council is the multi-agent reasoning layer of WebKurierCore.

It is used when direct routing is not sufficient and the system needs deeper evaluation before selecting a route, agent, or response strategy.

---

## 2. Responsibilities

SecondSelf Council is responsible for:
- resolving ambiguous intent
- comparing multiple valid routing targets
- selecting specialists
- generating consensus recommendations
- escalating sensitive or complex decisions

---

## 3. When Council Is Used

Council is typically invoked when:
- intent is ambiguous
- multiple domains are plausible
- request complexity is high
- premium reasoning is enabled
- a high-risk action requires additional confidence

---

## 4. Council Modes

### Direct Routing Support
Council is skipped when routing is obvious.

### Specialist Mode
One best-fit expert is selected.

### Consensus Mode
Multiple participants evaluate the task and produce a shared decision.

### Escalation Mode
Used for sensitive or privileged operations where additional control is needed.

---

## 5. Decision Flow

```mermaid
flowchart LR
    A[Request] --> B[Routing Engine]
    B --> C{Ambiguous or High-Risk?}
    C -- no --> D[Direct Route]
    C -- yes --> E[SecondSelf Council]
    E --> F[Recommendation]
    F --> G[Dispatch]


⸻

6. Inputs

Council may receive:
	•	original task
	•	user tier
	•	request context
	•	candidate routes
	•	policy constraints
	•	prior agent signals

Example:

{
  "task": "Help me with a drone mission and safety check",
  "context": {
    "tier": "premium",
    "candidate_routes": ["VehicleHub", "Security"]
  }
}


⸻

7. Outputs

Council should return:
	•	selected route
	•	selected agent or domain
	•	reasoning mode
	•	confidence or recommendation strength
	•	optional fallback path

Example:

{
  "decision": "VehicleHub",
  "mode": "consensus",
  "fallback": "Security",
  "confidence": "high"
}


⸻

8. Trigger Conditions

Council should be triggered by:
	•	ambiguity threshold exceeded
	•	multiple domain matches
	•	high-value premium workflow
	•	elevated risk category
	•	need for cross-domain reasoning

⸻

9. Cost Control

Council is more expensive than direct routing, so it should be controlled.

Control Rules
	•	do not invoke council for obvious requests
	•	cap number of participating agents
	•	cap reasoning depth
	•	degrade to specialist mode under load
	•	fall back to direct route if unavailable

⸻

10. Entitlement Sensitivity

Council behavior may vary by tier.

Example
	•	Free → minimal reasoning
	•	Pro → broader specialist selection
	•	Premium → deeper consensus or escalation workflows

⸻

11. Failure Handling

If Council fails:
	•	fall back to direct routing when safe
	•	return reduced capability response if needed
	•	never bypass security or entitlement checks
	•	log abnormal reasoning failure for analysis

⸻

12. Design Principles
	•	routing support, not uncontrolled autonomy
	•	policy-first decisions
	•	bounded reasoning depth
	•	graceful degradation
	•	explainable route selection where practical

⸻

13. Summary

SecondSelf Council is the reasoning layer that helps WebKurierCore choose the best route when tasks are ambiguous, complex, or sensitive.

Its job is to improve routing quality while remaining:
	•	bounded
	•	policy-aware
	•	cost-controlled
	•	safe under failure

---

Если хочешь, следующим логичным шагом будет собрать **единый финальный пакет `README.md + docs/*` в одной согласованной структуре**.