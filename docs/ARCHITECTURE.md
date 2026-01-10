# WebKurierCore Architecture

This document defines the **canonical architecture standard** for the WebKurier ecosystem.
WebKurierCore is the **primary user gateway** and **cognitive routing engine**.

## Visual Map (Single Source)

The project uses a single visual map as a standard reference:

- **ARCHITECTURE.svg** (public): `WebKurierSite/assets/ARCHITECTURE.svg`

Recommended usage:
- Link it from documentation hubs (WebKurierSite/docs).
- Use it as OpenGraph preview image for docs hub and key pages.
- Reference it from Core architecture documents as the top-level view.

> Note: The SVG is intentionally public and contains **no secrets**.

---

## Standard Routing Rule

**User → WebKurierCore → Domain Cores**

WebKurierCore never executes heavy domain logic directly.  
It routes validated commands to specialized domain cores and enforces boundaries.

### Mandatory gates (cannot be bypassed)
- **WebKurierSecurity** — validation gates, scanning, 2FA, token/session integrity
- **WebKurierChain** — integrity, ledger, encrypted events, audit trail

If an action impacts:
- identity/authentication
- money/WebCoin
- access control
- deployments or secrets
- safety-critical operations  
then the action must pass **Security** validation and may require **Chain** logging.

---

## Repository Role Separation (Canonical)

### Level 0 — Orchestrator (Infrastructure only)
- **WebKurierHybrid**
  - CI/CD, deployments, Docker/Ansible, monitoring, configuration, orchestration
  - Does **not** interact with end users directly
  - Must not host business/domain logic

### Level 1 — Central Entry
- **WebKurierCore**
  - Main UI, terminal, agents runtime
  - Command routing to domain cores
  - Identity/session layer (via Security policies)
  - WebCoin access and user economy (via Chain)

### Level 2 — Domain Cores
- **PhoneCore**
  - STT/TTS pipelines, calls, translation engines, lessons back-end
- **VehicleHub**
  - autopilot, navigation, missions, terrain models, report generation
- **Chain**
  - blockchain ledger, encrypted storage, integrity verification, licensing proofs
- **Security**
  - URL/file checks, token/session integrity, anomaly detection, policy validation

### Level 3 — Client Apps
- **WebKurierPhone-iOS**
- **WebKurierPhone-Android**
Client apps connect to Core + relevant domain cores (PhoneCore, etc.).

### Level 4 — Public Layer
- **WebKurierSite**
  - product pages, docs hub, public resources (incl. ARCHITECTURE.svg)

### Level 5 — Reserve / Future
- **WebKurierX**
  - future experiments and extensions

---

## Trust Model (Boundaries)

- **Trusted:** Hybrid, Core logic, Chain integrity
- **Semi-trusted:** PhoneCore, VehicleHub
- **Untrusted:** browsers, mobile devices, external streams

Rules:
1. Untrusted inputs must be sanitized and validated (Security).
2. No agent may bypass Chain integrity, Security validation, or Hybrid secrets boundary.
3. Core routes all actions; domain cores execute domain-specific tasks only.

---

## Naming Standard (Project Convention)

This is a **project order rule** (not a SEO rule).

### Canonical naming
- **WebKurierCore** — uses prefix in file names and docs pages.
- **PhoneCore / VehicleHub / Chain / Security** — use short names in URLs and docs files.

Examples:
- ✅ `docs/WebKurierCore.html`
- ✅ `docs/PhoneCore.html`
- ✅ `docs/VehicleHub.html`
- ✅ `docs/Chain.html`
- ✅ `docs/Security.html`

Avoid outdated naming in public docs:
- ❌ `DroneHybrid.html` (legacy)  
- ✅ `VehicleHub.html` (current)

---

## Enforcement Notes (Implementation)

To keep the architecture clean:
- WebKurierCore is the only place that accepts user commands and dispatches tasks.
- Domain cores must reject direct execution attempts that bypass Core policies.
- Security checks must run before sensitive actions.
- Chain is the canonical audit log for financial and integrity events.

---

## Links (Public Docs Hub)

- WebKurierSite Docs Hub: `/docs/`
- Architecture SVG: `/assets/ARCHITECTURE.svg`