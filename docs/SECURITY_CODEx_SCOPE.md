# Codex Security Scope (WebKurierCore)

Codex operates in **repo-local scope only**.
It may scan **only the repository where its workflow is executed**.
Codex must NOT access, checkout, or scan other WebKurier repositories (Core, Chain, Security, PhoneCore, etc.) by default.

Any multi-repository analysis is **explicitly forbidden** unless:
- orchestrated via WebKurierHybrid,
- protected by WebKurierSecurity,
- limited by an allowlist of repositories,
- audited and logged (Chain/Security).

Codex must not bypass Core routing, Chain integrity, or Security validation.