# WebKurierCore — CODEX TASKS PACK (10 IDEAL TASKS) ✅
Версия: 1.0  
Цель: дать готовые задания для Codex, чтобы пошагово усилить WebKurierCore без хаоса.

Формат использования:
1) Открываешь https://chatgpt.com/codex
2) Выбираешь окружение WebKurierCore
3) Вставляешь один блок целиком
4) Ждёшь результат → смотришь вкладку “Разница” → Merge PR

---

## ✅ TASK 01 — Boot & Verify (Node + FastAPI)
**Цель:** убедиться, что Core поднимается и есть понятные проверки.

```text
/plan
Goal: Boot WebKurierCore locally in Codex environment and verify core API.
Tasks:
1) Detect project entrypoints for Node/Express and Python FastAPI.
2) Ensure there is one unified command to start both services (dev:all).
3) Verify endpoints: GET /health, POST /api/codex/run, and FastAPI heartbeat.
4) Update README.md with step-by-step run and verification commands.
Done when:
- npm run dev:all exists
- /health returns { ok: true }
- README has exact steps and ports