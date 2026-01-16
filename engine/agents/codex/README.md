# CodexAgent (WebKurierCore) — MVP

**Codex-mode** adds an **agentic coding workflow** to the WebKurierCore terminal.
It enables controlled, auditable, server-side code modifications through EngineerAgent.

Architecture:
User → Terminal → EngineerAgent → CodexAgent → Tools → Repo  
(with mandatory Security Gates and future Chain audit)

---

## What this is

A **server-side agent runner** that:

- explores the repository using **safe, read-only tools**
- **reads files before editing** (no guessing)
- writes **ONLY via unified diff patches** (`apply_patch`)
- enforces **security gates before any change**
- never exposes secrets or OpenAI keys to the client

CodexAgent is **not a chatbot** — it is an operational coding agent.

---

## MVP Commands (Terminal)

Available via EngineerAgent:

- `/engineer codex on`
- `/engineer codex off`
- `/engineer codex ask <task>`
- `/engineer codex tools`
- `/engineer codex prompt`
- `/engineer codex compact` *(planned)*

---

## Security Model (Core → Security → Chain)

### Security Gates (enforced before apply_patch)

Blocked by default:

- 🔐 **Secrets**
  - `.env`
  - private keys
  - `engine/config/secrets.json`

- 🧱 **Destructive operations**
  - `rm -rf`
  - `git reset --hard`
  - `git clean -fd`
  - mass deletions or rewrites

- 📂 **Out-of-scope changes**
  - files outside allowlist  
    *(default: `engine/`, `api/`, `server/`, `frontend/`)*

### Audit & Integrity (Chain — next step)

Audit hook already exists conceptually:

- patch metadata (hash)
- touched files
- timestamps
- execution context

Planned: encrypted, append-only Chain log.

---

## What this gives right now

- 🔐 **Hard perimeter**  
  Codex cannot touch secrets or escape allowed directories.

- 🧱 **Catastrophe protection**  
  Destructive commands and unsafe patches are blocked.

- 📏 **Scale control**  
  Limits on:
  - patch size
  - number of affected files

- 🧠 **Determinism**  
  Security gates are pure functions — reproducible and auditable.

---

## Folder Contents

- `codex-prompt.md` — system prompt for CodexAgent
- `codex-agent.js` — agent runner (server-side)
- `tools-registry.js` — tool schemas & registry
- `tools/` — tool wrappers (`read`, `list`, `search`, `apply_patch`)
- `policy/security-gates.js` — allow/deny rules

---

## Control Checklist (5 seconds)

After MVP wiring is complete:

- `/engineer codex on`
- `/engineer codex ask <task>`
- Codex:
  - reads files
  - searches repository
  - applies **safe patch**
- 🔑 OpenAI keys are **server-side only**
- 🖥️ Terminal remains clean
- 🧱 Core / Security / Chain architecture preserved

---

## Next Steps (after MVP)

1. ✅ Wire repo adapter (fs + glob + rg + patch apply)
2. ✅ Add API endpoint: `/api/codex/run` (server-side)
3. ⏳ Integrate Chain audit (encrypted event log)
4. ⏳ Add compaction persistence into Chain


