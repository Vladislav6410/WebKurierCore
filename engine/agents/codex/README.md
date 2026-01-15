# CodexAgent (WebKurierCore) — MVP

Codex-mode adds an agentic coding workflow to the WebKurierCore terminal.

## What this is
A server-side agent runner that:
- explores the repository with safe tools
- reads files before editing
- writes ONLY via unified diff patches (`apply_patch`)
- enforces security gates before any change

## MVP Commands (terminal)
- /codex on
- /codex off
- /codex ask <task>
- /codex tools
- /codex prompt
- /codex compact (planned)

## Security model (Core → Security/Chain)
- Security gates block:
  - secrets (.env, keys, engine/config/secrets.json)
  - destructive operations (rm -rf, git reset --hard, etc.)
  - changes outside allowlist (default: engine/**, api/**)
- Audit hook exists (Chain integration later):
  - patch metadata, touched files, timestamps

## Folder contents
- codex-prompt.md — system prompt for CodexAgent
- codex-agent.js — agent runner (server-side)
- tools-registry.js — tool schemas + registry
- tools/ — tool wrappers (read/list/search/apply_patch)
- policy/security-gates.js — allow/deny rules

## Next steps (after MVP)
1) Wire repo adapter (fs + glob + rg + patch apply)
2) Add API endpoint: /api/codex/run (server-side)
3) Integrate Chain audit (encrypted event log)
4) Add compaction persistence into Chain