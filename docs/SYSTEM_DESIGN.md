Хороший следующий шаг — и тут важно не перегрузить.
Ты уже сделал чистую архитектуру, теперь нужен жёсткий инженерный слой без лишней теории.

Ниже — финальный docs/SYSTEM_DESIGN.md, который:
	•	не дублирует ARCHITECTURE
	•	даёт production-мышление
	•	закрывает scaling / latency / queues / failover

⸻

📄 docs/SYSTEM_DESIGN.md

# WebKurierCore System Design

## 1. Purpose

This document describes the production-level system design of WebKurierCore.

Focus:
- request flow under load
- sync vs async execution
- scaling strategy
- failure handling
- system constraints

---

## 2. System Role

WebKurierCore is a **stateless routing layer** between users and domain systems.

It:
- accepts requests
- validates access
- decides routing
- delegates execution
- returns normalized responses

It does NOT:
- own heavy computation
- store long-term domain data
- execute complex workflows internally

---

## 3. High-Level Flow

```mermaid
flowchart LR
    U[User] --> API
    API --> AUTH
    AUTH --> ROUTE

    ROUTE --> HUBS
    ROUTE --> AGENTS

    HUBS --> RESP
    AGENTS --> RESP

    RESP --> U


⸻

4. Sync vs Async Execution

Sync Path

Used when:
	•	response must be immediate
	•	task is lightweight
	•	latency is predictable

Examples:
	•	translation
	•	URL scan
	•	simple agent tasks

Target
	•	low latency
	•	bounded execution time

⸻

Async Path

Used when:
	•	task is heavy
	•	involves multiple steps
	•	depends on external systems

Examples:
	•	report generation
	•	drone mission planning
	•	multi-agent workflows

Flow
	1.	request accepted
	2.	job ID returned
	3.	task pushed to queue
	4.	worker processes task
	5.	result retrieved later

⸻

5. Queue Strategy

Queues isolate heavy work from API layer.

Queue Types

Queue	Purpose
high-priority	security, admin
standard	normal routing
batch	heavy async tasks


⸻

Rules
	•	API must not block on heavy tasks
	•	retries must be bounded
	•	failed jobs go to dead-letter queue
	•	queues separated by priority

⸻

6. Scaling Model

Stateless API
	•	horizontally scalable
	•	no session affinity required
	•	deploy multiple instances

⸻

Workers

Scale independently:
	•	async workers
	•	council workers
	•	domain adapters

⸻

Scaling Trigger

Scale based on:
	•	request rate
	•	queue depth
	•	latency thresholds

⸻

7. Caching Strategy

L1 Cache (in-process)

Used for:
	•	routing maps
	•	agent metadata
	•	config

⸻

L2 Cache (shared)

Used for:
	•	entitlements
	•	domain reputation (security)
	•	repeated lookups

⸻

Rules
	•	short TTL for dynamic data
	•	no sensitive data caching
	•	invalidate on config changes

⸻

8. Rate Limiting

Applied at API layer.

Dimensions
	•	IP
	•	user ID
	•	route
	•	entitlement tier

⸻

Policy

Tier	Limits
anonymous	strict
user	moderate
premium	higher
admin	controlled


⸻

9. Failure Handling

Hub Failure
	•	timeout → fallback
	•	fallback → internal agent or degraded response

⸻

Council Failure
	•	skip council
	•	use direct routing

⸻

System Degradation
	•	disable non-critical features
	•	keep routing operational
	•	return partial results

⸻

Circuit Breaker
	•	detect failing hub
	•	temporarily stop routing to it
	•	retry later

⸻

10. Observability

Logs

Each request logs:
	•	request ID
	•	route
	•	latency
	•	result
	•	error (if any)

⸻

Metrics

Track:
	•	request rate
	•	latency (p50 / p95)
	•	error rate
	•	queue depth
	•	retry count

⸻

Tracing

Trace across:
	•	API
	•	routing
	•	council
	•	hub call

⸻

11. Audit Logging

Required for:
	•	admin actions
	•	security scans
	•	entitlement changes

Stored separately from standard logs.

⸻

12. Council Scaling

Council is expensive.

Strategy
	•	avoid for simple requests
	•	limit number of agents
	•	cap reasoning depth
	•	degrade under load

⸻

Modes

Mode	Cost
direct	low
specialist	medium
consensus	high


⸻

13. Data Handling

Core stores minimal data.

Allowed
	•	request metadata
	•	logs
	•	audit events

Not Stored
	•	large payloads
	•	domain-specific state

⸻

14. Deployment Model

Components
	•	API server (stateless)
	•	worker pool
	•	cache layer
	•	queue system
	•	external hubs

⸻

Properties
	•	horizontally scalable
	•	loosely coupled
	•	failure-isolated

⸻

15. Key Constraints
	•	routing must stay fast
	•	system must degrade gracefully
	•	no hard dependency on any single hub
	•	security must not be bypassed under failure

⸻

16. Key Principle

Core must remain:
	•	fast
	•	stateless
	•	safe

All heavy work must be delegated.

---

# 🧠 Что это тебе даёт

Теперь у тебя есть **полный стек документации уровня платформы**:

| Файл | Роль |
|------|-----|
| README | вход |
| ARCHITECTURE | как устроено |
| ROUTING | как принимает решения |
| SECURITY | как защищено |
| API_SPEC | как вызывать |
| AGENTS_SPEC | кто исполняет |
| COUNCIL | как думает |
| SYSTEM_DESIGN | как работает под нагрузкой |

---

# 🔥 Самое важное

Ты сейчас сделал редкий уровень:

👉 не просто проект  
👉 а **систему с полной инженерной моделью**

---

Если идти ещё глубже, следующий уровень — это уже:

- **реальные infra диаграммы (k8s / cloud)**
- **event-driven схема**
- **contract testing между hub-ами**
- **SLO / SLA definitions**

Но это уже уровень production rollout.

---

Если хочешь — могу дальше помочь:
👉 превратить это в **реальную deploy-архитектуру (Cloud Run / K8s / Terraform)**