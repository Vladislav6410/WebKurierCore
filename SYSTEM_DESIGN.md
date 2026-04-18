Да — именно так. Ниже даю уже готовый SYSTEM_DESIGN.md в сильном, структурном формате, чтобы он логично шел после README и ARCHITECTURE.md.

⸻

SYSTEM_DESIGN.md

# WebKurierCore System Design

## 1. Purpose

WebKurierCore is the primary gateway and cognitive routing engine of the WebKurier ecosystem.

From a system design perspective, its role is to:

- accept user requests from multiple interfaces
- authenticate and validate access
- classify intent
- apply entitlement and policy checks
- optionally invoke SecondSelf Council reasoning
- route the task to the correct domain hub or internal agent
- aggregate and normalize results
- return a unified response

WebKurierCore is designed as a **control-plane and interaction-plane system**, not as the single execution engine for all domain workloads.

---

## 2. Design Goals

### Primary Goals
- low-latency request routing
- unified user interaction across web, CLI, and API
- clean separation between routing and execution
- safe handling of privileged and sensitive actions
- modular growth across multiple domain hubs
- compatibility with legacy and new architecture during migration

### Non-Goals
- not all domain logic lives inside Core
- not all heavy compute should execute inside Core
- not all persistent business state should be stored in Core

---

## 3. High-Level System Model

```mermaid
flowchart LR
    U[User]
    W[Web / CLI / API]
    A[Auth & Session]
    R[Routing Engine]
    E[Entitlements / Policy]
    C[SecondSelf Council]
    N[Normalizer / Response Composer]

    VH[VehicleHub]
    PH[PhoneCore]
    CH[Chain]
    SH[Security]
    IA[Internal Agents]

    U --> W
    W --> A
    A --> R
    R --> E
    E --> C
    C --> VH
    C --> PH
    C --> CH
    C --> SH
    C --> IA

    VH --> N
    PH --> N
    CH --> N
    SH --> N
    IA --> N

    N --> W
    W --> U


⸻

4. Core Architectural Principles

4.1 Stateless Request Handling

Most request processing should be stateless at the API and routing layer.

Benefits:
	•	easy horizontal scaling
	•	simpler rollback/redeploy
	•	better container orchestration behavior
	•	reduced affinity requirements

4.2 State Is Externalized

Long-lived state should live outside request workers:
	•	sessions
	•	caches
	•	audit logs
	•	entitlement store
	•	rate-limit state
	•	task queues
	•	domain-specific persistence

4.3 Router, Not Executor

Core should only execute lightweight local logic:
	•	request parsing
	•	policy checks
	•	classification
	•	routing
	•	response composition

Heavy execution should be delegated to:
	•	domain hubs
	•	specialized agent services
	•	background jobs
	•	external infrastructure

4.4 Progressive Migration

The system must support both:
	•	legacy engine-based flows
	•	new modular monorepo services

⸻

5. Component Breakdown

5.1 Entry Surfaces

Web Portal

Primary end-user interface for:
	•	agent selection
	•	portal flows
	•	interactive sessions
	•	authenticated operations

CLI Terminal

Operator and developer surface for:
	•	diagnostics
	•	search
	•	agent invocation
	•	repository and environment commands

API Server

Primary machine-facing ingress for:
	•	health endpoints
	•	agent routing
	•	integration points
	•	future service-to-service control paths

⸻

5.2 Core Runtime Components

API Gateway Layer

Responsibilities:
	•	receive HTTP requests
	•	enforce request size/time limits
	•	attach correlation IDs
	•	apply middleware
	•	forward requests to internal routing logic

Authentication Layer

Responsibilities:
	•	verify identity
	•	resolve session/user context
	•	attach role/tier metadata

Entitlement Engine

Responsibilities:
	•	determine access tier
	•	enable/disable routes and agents
	•	enforce premium/admin-only capabilities
	•	shape council depth and routing mode

Routing Engine

Responsibilities:
	•	classify request
	•	select domain or internal path
	•	decide sync vs async path
	•	invoke council when needed

SecondSelf Council

Responsibilities:
	•	resolve ambiguity
	•	perform multi-agent reasoning
	•	select specialist or consensus path
	•	recommend final routing target

Response Composer

Responsibilities:
	•	normalize heterogeneous hub outputs
	•	attach structured metadata
	•	produce final user-facing format

⸻

6. API Boundary

WebKurierCore should expose a narrow and stable API surface.

Recommended Boundary Categories

Public/Client API
	•	session-aware user requests
	•	portal interactions
	•	agent invocation
	•	read-only discovery metadata
	•	health checks

Internal Control API
	•	service-to-service routing
	•	agent bridge operations
	•	diagnostics and orchestration hooks

Admin API
	•	restricted administrative controls
	•	audit lookup
	•	policy inspection
	•	operational overrides

⸻

6.1 Example API Shape

Health

GET /health

Agent Invocation

POST /api/v1/agent/:agentId

Routed Task Submission

POST /api/v1/route

Council Evaluation

POST /api/v1/council/evaluate

Security-Restricted Admin Endpoint

POST /api/v1/admin/command


⸻

6.2 API Design Rules
	•	version all external APIs
	•	keep response envelopes consistent
	•	include request ID / trace ID
	•	separate public and privileged routes
	•	keep internal contracts typed and explicit
	•	use structured errors, not raw stack traces

Recommended envelope:

{
  "ok": true,
  "request_id": "req_123",
  "route": "security",
  "mode": "sync",
  "data": {},
  "meta": {}
}

Error envelope:

{
  "ok": false,
  "request_id": "req_123",
  "error": {
    "code": "ACCESS_DENIED",
    "message": "User tier does not allow this action"
  }
}


⸻

7. Sync vs Async Flows

A critical design decision is whether a request should be processed synchronously or asynchronously.

7.1 Synchronous Flows

Use sync flows when:
	•	user expects immediate response
	•	task is lightweight
	•	routing decision is fast
	•	downstream completion time is predictable

Examples:
	•	health checks
	•	basic agent routing
	•	translation snippet
	•	phishing URL check
	•	entitlement validation
	•	quick council recommendation

Sync SLO Target
	•	p50: very low latency
	•	p95: bounded interactive latency
	•	hard timeout for user-facing endpoints

⸻

7.2 Asynchronous Flows

Use async flows when:
	•	task is heavy or multi-stage
	•	work depends on external systems
	•	response generation may exceed UI timeout budgets
	•	retries and decoupling are valuable

Examples:
	•	large report generation
	•	long-running drone planning workflow
	•	complex multi-agent deliberation
	•	bulk security scans
	•	media generation pipelines
	•	audit export or historical rebuild

Async Pattern
	1.	request accepted
	2.	job ID returned
	3.	task queued
	4.	worker processes task
	5.	status endpoint/webhook/event updates result
	6.	final output retrieved asynchronously

⸻

8. Queue Strategy

Queueing is essential for resilience and workload isolation.

8.1 Why Queues Are Needed

Queues help:
	•	protect interactive APIs from slow work
	•	smooth burst traffic
	•	isolate workload classes
	•	support retries
	•	enable backpressure
	•	keep Core responsive

8.2 Queue Classes

High Priority

For near-real-time sensitive work:
	•	security validation
	•	interactive premium routing
	•	admin-approved urgent tasks

Standard Priority

For normal routed tasks:
	•	common agent requests
	•	standard council workflows
	•	normal integration calls

Batch / Low Priority

For deferred heavy work:
	•	report generation
	•	historical analysis
	•	indexing
	•	offline enrichment

⸻

8.3 Queue Design Recommendations

Use separate queues by:
	•	priority
	•	task type
	•	domain
	•	retry characteristics

Suggested queue families:
	•	route-high
	•	route-standard
	•	council-eval
	•	security-scan
	•	report-build
	•	notification-events

⸻

8.4 Retry Policy

Retries should be selective.

Safe to retry:
	•	idempotent reads
	•	temporary downstream timeout
	•	transient network failure
	•	rate-limited external dependency

Do not blindly retry:
	•	non-idempotent financial actions
	•	privileged admin commands
	•	ambiguous side-effect operations

Retry model:
	•	exponential backoff
	•	bounded retry count
	•	dead-letter queue on permanent failure

⸻

9. Cache Strategy

Caching should reduce latency and external load without breaking correctness.

9.1 What to Cache

Good cache candidates:
	•	entitlement lookups
	•	routing metadata
	•	agent capability maps
	•	non-sensitive config
	•	domain reputation lookups
	•	repeated council heuristics
	•	static docs and discovery metadata

9.2 What Not to Cache

Avoid or strictly control caching for:
	•	raw secrets
	•	short-lived auth tokens
	•	sensitive personal payloads
	•	non-idempotent transaction results
	•	admin responses with privileged data

9.3 Cache Layers

L1 In-Process Cache

Use for:
	•	hot config
	•	small routing tables
	•	frequently reused metadata

Pros:
	•	extremely fast

Cons:
	•	not shared across replicas

L2 Shared Cache

Use for:
	•	entitlement snapshots
	•	external reputation results
	•	task metadata
	•	route precomputations

Typical fit:
	•	Redis or equivalent shared low-latency cache

⸻

9.4 Cache Invalidation Rules
	•	TTL-based expiration for non-critical data
	•	event-based invalidation for policy changes
	•	explicit purge for admin/entitlement updates
	•	conservative TTL for security-sensitive signals

⸻

10. Rate Limits

Rate limiting protects both platform stability and downstream services.

10.1 Rate Limit Dimensions

Apply limits by:
	•	IP
	•	user ID
	•	API key
	•	session
	•	tenant
	•	route category
	•	privilege level

10.2 Suggested Policy Model

Public Anonymous Traffic

Strictest limits.

Authenticated User Traffic

Moderate limits, tier-based.

Premium / Trusted Traffic

Higher thresholds, but still bounded.

Admin Traffic

Restricted by identity and policy, not unlimited.

⸻

10.3 Route-Specific Limits

Different routes require different budgets:
	•	/health → very high tolerance
	•	/api/v1/route → moderate
	•	/api/v1/council/evaluate → tighter
	•	/api/v1/admin/* → strict + audit-enforced
	•	heavy async submission endpoints → strict burst control

⸻

11. Observability

WebKurierCore should be fully observable.

11.1 Logging

All critical request paths should emit structured logs with:
	•	timestamp
	•	request ID
	•	trace ID
	•	route
	•	user or anonymous scope
	•	entitlement tier
	•	target hub/agent
	•	latency
	•	outcome
	•	error code

11.2 Metrics

Minimum metrics set:
	•	request count
	•	success/failure rate
	•	latency percentiles
	•	per-route traffic
	•	per-domain routing frequency
	•	council invocation rate
	•	cache hit/miss ratio
	•	queue depth
	•	retry count
	•	downstream timeout rate

11.3 Tracing

Use distributed tracing across:
	•	ingress
	•	auth
	•	routing engine
	•	council
	•	domain hub call
	•	response composition

This is critical once multiple hubs and async workflows are involved.

⸻

12. Audit Logging

Audit logging is separate from general observability logs.

12.1 What Must Be Audited
	•	admin commands
	•	entitlement changes
	•	role-sensitive routing decisions
	•	security-relevant scans
	•	policy override actions
	•	system configuration changes
	•	access to protected operations

12.2 Audit Record Fields

Recommended fields:
	•	actor ID
	•	actor role
	•	tenant
	•	action
	•	target object
	•	previous state
	•	new state
	•	timestamp
	•	source IP / client identity
	•	request ID
	•	approval context if required

12.3 Audit Storage Rules
	•	append-only preferred
	•	tamper-evident storage recommended
	•	longer retention than normal logs
	•	restricted read access
	•	searchable by compliance and admin tooling

⸻

13. Multi-Tenant Access Model

If WebKurierCore evolves into a multi-tenant system, tenancy boundaries must be first-class.

13.1 Tenant Scope

Every request should resolve:
	•	tenant ID
	•	user ID
	•	role
	•	entitlement tier
	•	environment scope

13.2 Isolation Requirements

Tenant isolation should apply to:
	•	sessions
	•	cached responses
	•	audit records
	•	usage quotas
	•	billing scope
	•	policy overlays
	•	agent visibility

13.3 Tenant-Aware Routing

The routing engine may vary by tenant:
	•	enabled hubs
	•	allowed agents
	•	council mode
	•	language defaults
	•	security policy hardness
	•	custom integrations

⸻

14. SecondSelf Council Scaling Profile

SecondSelf Council is one of the most expensive logical components in the system.

14.1 Why It Is Expensive

Council may involve:
	•	multiple agent perspectives
	•	ranking and debate
	•	reasoning over larger context
	•	result aggregation
	•	fallback or escalation loops

14.2 Scaling Strategy

Fast Path

Most requests should bypass deep council reasoning when simple routing is obvious.

Shallow Council

For mildly ambiguous requests:
	•	limited number of specialists
	•	short reasoning budget
	•	strict latency cap

Deep Council

For premium or high-value workflows:
	•	broader debate
	•	longer context
	•	richer output
	•	possibly async fallback

⸻

14.3 Council Protection Rules

To prevent cost explosion:
	•	require council only when ambiguity threshold is exceeded
	•	cap agent count per deliberation
	•	cap tokens/context size
	•	degrade gracefully under load
	•	switch to specialist routing when system is saturated

⸻

15. Failover Between Hubs

Core must tolerate partial ecosystem degradation.

15.1 Failure Types
	•	hub unavailable
	•	hub timeout
	•	malformed response
	•	degraded upstream dependency
	•	policy service unavailable
	•	cache unavailable
	•	queue backlog

15.2 Failover Strategies

Timeout + Fallback

If a target hub exceeds timeout:
	•	return partial failure
	•	fallback to simpler mode
	•	optionally enqueue async completion

Alternate Specialist

If primary route is unavailable:
	•	use internal specialist agent where possible
	•	return reduced capability response

Graceful Degradation

Examples:
	•	council disabled → direct routing only
	•	shared cache down → local cache only
	•	enrichment dependency down → basic response only

Circuit Breakers

Use circuit breakers for unstable downstream hubs to avoid cascading failure.

⸻

16. Security Model

16.1 Trust Boundaries

Key trust boundaries include:
	•	user/client to public API
	•	public API to internal routing
	•	Core to domain hubs
	•	admin surfaces to control-plane actions
	•	secret/config access to runtime

16.2 Security Controls

Recommended controls:
	•	strict authN/authZ
	•	role- and tier-based access
	•	request validation
	•	output sanitization
	•	rate limiting
	•	secret isolation
	•	signed internal service calls where possible
	•	audit trail for privileged actions

16.3 Sensitive Action Policy

Sensitive operations should require:
	•	elevated role
	•	explicit policy match
	•	audit record
	•	optional step-up authentication for critical commands

⸻

17. Data Handling Model

17.1 Data Classes

Suggested categories:
	•	public metadata
	•	operational metadata
	•	user content
	•	sensitive user content
	•	privileged admin data
	•	security and audit records

17.2 Retention

Different retention policies should apply by data class:
	•	short-lived request traces
	•	medium-term application logs
	•	long-term audit events
	•	minimal storage of sensitive payloads unless necessary

17.3 Minimization

Core should avoid long-term storage of payloads that belong in domain systems.

Principle:
route what is needed, store only what is justified.

⸻

18. Deployment Model

18.1 Baseline Deployment

A practical deployment can include:
	•	stateless API containers
	•	shared cache
	•	queue broker
	•	worker pool
	•	centralized logs/metrics
	•	external domain hub integrations

18.2 Container Strategy

Containerize:
	•	apps/api-server
	•	optional Python service
	•	worker services for async jobs

18.3 Horizontal Scaling

Scale independently:
	•	ingress/API pods
	•	council workers
	•	async workers
	•	domain-specific adapters

This avoids scaling the entire system just because one subsystem is under pressure.

⸻

19. SLO / Reliability Thinking

Recommended priorities:

Availability

User routing paths should be highly available.

Latency

Interactive routes must remain fast even when async workloads spike.

Correctness

Entitlement and security decisions are more important than raw speed.

Degradation

It is better to return a reduced response than to fully block the platform when one hub fails.

⸻

20. Recommended Future Improvements
	•	unify all route contracts into typed schemas
	•	introduce explicit command bus for internal routing
	•	formalize council trigger thresholds
	•	move legacy configs toward typed policy modules
	•	separate public API, internal API, and admin API
	•	add centralized policy engine
	•	enforce idempotency keys for sensitive operations
	•	introduce tenant-aware observability views
	•	standardize dead-letter handling
	•	add replay-safe audit event pipeline

⸻

21. Example End-to-End Flow

Example: Security Scan Request

sequenceDiagram
    participant U as User
    participant API as API Server
    participant AUTH as Auth/Entitlement
    participant ROUTE as Routing Engine
    participant SEC as Security Hub
    participant RESP as Response Composer
    participant AUDIT as Audit Log

    U->>API: POST /api/v1/route
    API->>AUTH: Validate identity and tier
    AUTH-->>API: Context attached
    API->>ROUTE: Classify request
    ROUTE->>SEC: Forward security scan
    SEC-->>ROUTE: Risk result
    ROUTE->>RESP: Normalize output
    RESP-->>API: Unified response
    API->>AUDIT: Record sensitive action metadata
    API-->>U: Final result


⸻

22. Summary

WebKurierCore should be designed as a resilient, policy-aware, stateless-by-default routing platform.

Its strongest architecture is:
	•	thin ingress layer
	•	explicit auth and entitlement control
	•	lightweight routing core
	•	optional scalable council reasoning
	•	delegated domain execution
	•	strong observability and auditability
	•	graceful degradation under partial failure

The system succeeds when it stays fast, safe, and modular while coordinating increasingly complex machine capabilities across the WebKurier ecosystem.

---

## Что это дает

Этот файл уже закрывает ключевые инженерные вопросы:

- где граница API
- что синхронно, а что асинхронно
- зачем очереди
- как кэшировать
- как ограничивать нагрузку
- как строить audit trail
- как масштабировать Council
- как переживать падение hub-ов

---

## Правильный комплект файлов теперь такой

### `README.md`
позиционирование проекта, обзор, запуск, структура

### `ARCHITECTURE.md`
архитектурная карта, слои, роутинг, связь с hub-ами

### `SYSTEM_DESIGN.md`
production-мышление: latency, queues, caching, failover, observability, security boundaries

---

## Что я рекомендую следующим шагом

Теперь самый сильный ход — сделать еще 2 файла:

### `ROUTING.md`
где будет:
- матрица маршрутизации
- правила выбора hub / agent
- fallback logic
- council trigger conditions
- entitlement-based route restrictions

### `SECURITY.md`
где будет:
- auth model
- secret handling
- admin boundaries
- audit policy
- anti-abuse controls
- phishing / security scan integration model

Если хочешь, следующим сообщением я соберу тебе **готовый `ARCHITECTURE.md` + `ROUTING.md` + `SECURITY.md` в одном финальном пакете**.