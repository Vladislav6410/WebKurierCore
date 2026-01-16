# WebKurierCore — Architecture (Core Gateway)

This document is the single source of truth for the **WebKurierCore** repository structure, entrypoints, ports,
and where to place new code (agents, routes, UI, configs).

---

## 1) What WebKurierCore is

**WebKurierCore** is the primary user gateway and routing engine of the WebKurier ecosystem.

Responsibilities:
- Web UI entry point (portal / tiles / agent UI)
- Terminal & command routing (Core → agents / services)
- Node/Express API gateway
- Python/FastAPI backend services (telemetry and similar)
- Codex/LLM bridge endpoints (via Node API)
- Safe boundaries: secrets via env/CI, audit hooks for Chain/Security

---

## 2) Tech stack (current)

### Node (Express) — API Gateway
- Entrypoint: `server/index.js`
- Default port: `3000`
- Hosts routes under `/api/*`
- Serves some static UI (e.g., approvals UI) from `frontend/`

### Python (FastAPI) — Backend services
- Entrypoint: `backend/app/main.py`
- Run script: `backend/start_uvicorn.sh`
- Default port: `8081`
- Used for telemetry endpoints (and future backend modules)

---

## 3) Canonical repository layout