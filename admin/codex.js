const API = {
  health: "/health",
  run: "/api/codex/run",
};

const el = (id) => document.getElementById(id);

const apiStatus = el("apiStatus");
const output = el("output");
const taskText = el("taskText");
const mode = el("mode");
const preset = el("preset");
const historyBox = el("history");

const STORAGE_KEY = "wk_codex_history_v1";

function setStatus(text, ok) {
  apiStatus.textContent = text;
  apiStatus.className = "pill " + (ok ? "ok" : "bad");
}

function print(obj) {
  output.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

async function getHealth() {
  try {
    const r = await fetch(API.health);
    const j = await r.json().catch(() => ({}));
    setStatus(`${r.status} ${r.ok ? "OK" : "FAIL"}`, r.ok);
    return { ok: r.ok, status: r.status, body: j };
  } catch (e) {
    setStatus("OFFLINE", false);
    return { ok: false, error: String(e) };
  }
}

async function postRun(payload) {
  const r = await fetch(API.run, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  let body = null;
  try { body = JSON.parse(txt); } catch { body = { raw: txt }; }

  return { ok: r.ok, status: r.status, body };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
  renderHistory();
}

function addToHistory(entry) {
  const items = loadHistory();
  items.unshift(entry);
  saveHistory(items);
}

function renderHistory() {
  const items = loadHistory();
  if (!items.length) {
    historyBox.innerHTML = `<div class="small">Пока пусто</div>`;
    return;
  }

  historyBox.innerHTML = items.map((it, idx) => {
    const t = new Date(it.ts).toLocaleString();
    const safeText = (it.taskText || "").replace(/[<>&]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[c]));
    const safeMode = (it.mode || "run").replace(/[<>&]/g, "");
    return `
      <div class="item" data-idx="${idx}">
        <b>${safeMode.toUpperCase()} — ${t}</b>
        <div class="meta">
          <span class="pill">${it.status ?? "—"}</span>
          <span class="pill">${it.ok ? "ok:true" : "ok:false"}</span>
        </div>
        <pre style="margin-top:8px;">${safeText}</pre>
        <div class="row" style="margin-top:8px;">
          <button class="btn ghost" data-act="use" data-idx="${idx}">Вставить</button>
          <button class="btn ghost" data-act="copy" data-idx="${idx}">Копировать</button>
          <button class="btn danger" data-act="del" data-idx="${idx}">Удалить</button>
        </div>
      </div>
    `;
  }).join("");

  historyBox.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.getAttribute("data-idx"));
      const act = b.getAttribute("data-act");
      const items = loadHistory();
      const it = items[idx];
      if (!it) return;

      if (act === "use") {
        taskText.value = it.taskText || "";
        mode.value = it.mode || "run";
      }
      if (act === "copy") {
        navigator.clipboard?.writeText(it.taskText || "");
      }
      if (act === "del") {
        items.splice(idx, 1);
        saveHistory(items);
      }
    });
  });
}

const PRESETS = {
  task1: `Goal: Boot WebKurierCore locally and verify API endpoints.
Steps:
1) Ensure npm install and python venv installed for backend.
2) Run: npm run dev:all
3) Verify:
   - GET /health returns {"ok":true}
   - POST /api/codex/run with {"taskText":"ping"} returns ok + output_text
Deliverable: short README update if needed.`,
  task2: `Implement POST /api/codex/run in the Node/Express server.
Requirements:
- Route: POST /api/codex/run
- Input JSON: { "taskText": string, "mode"?: "run"|"plan" }
- Validate: taskText required, max length 20k
- Response JSON: { "ok": true, "output_text": string, "meta": { ... } }
- On error: { "ok": false, "error": { "code": "...", "message": "..." } }
Also add a minimal unit or smoke test (optional).`,
  task3: `Add a minimal Codex control panel in WebKurierCore:
- Create /admin/codex.html + /admin/codex.js
- UI: textarea, preset select, mode plan/run, buttons Send/Copy/Save/Clear
- Calls POST /api/codex/run and prints response
- Keeps local history (localStorage)
Ensure it works on mobile.`,
  sec1: `Add security hardening for POST /api/codex/run:
- Basic rate limit per IP (in-memory ok for now)
- Reject non-JSON and large payloads
- Sanitize logs (no secrets)
- Add tests or a short docs note`,
  chain1: `Add audit logging for every /api/codex/run call:
- Emit an audit event with timestamp, user/session (if available), task hash, mode, result ok/fail
- For now write to a local log file (engine/logs/codex_audit.log) or sqlite (if present)
- No sensitive raw taskText stored; store hash + first 120 chars only.`,
};

preset.addEventListener("change", () => {
  const key = preset.value;
  if (!key) return;
  taskText.value = PRESETS[key] || "";
});

el("btnHealth").addEventListener("click", async () => {
  print("Checking /health...");
  const res = await getHealth();
  print(res);
});

el("btnPing").addEventListener("click", async () => {
  print("POST /api/codex/run ...");
  const res = await postRun({ taskText: "ping", mode: "run" });
  print(res);
  addToHistory({
    ts: Date.now(),
    mode: "run",
    taskText: "ping",
    ok: res.ok,
    status: res.status,
  });
});

el("btnSend").addEventListener("click", async () => {
  const text = (taskText.value || "").trim();
  const m = mode.value || "run";
  if (!text) {
    print({ ok: false, error: { code: "EMPTY", message: "taskText is empty" } });
    return;
  }

  print("Sending task...");
  const res = await postRun({ taskText: text, mode: m });
  print(res);

  addToHistory({
    ts: Date.now(),
    mode: m,
    taskText: text,
    ok: res.ok,
    status: res.status,
  });
});

el("btnCopy").addEventListener("click", async () => {
  await navigator.clipboard?.writeText(taskText.value || "");
});

el("btnSave").addEventListener("click", () => {
  const text = (taskText.value || "").trim();
  if (!text) return;
  addToHistory({
    ts: Date.now(),
    mode: mode.value || "run",
    taskText: text,
    ok: true,
    status: "saved",
  });
});

el("btnClear").addEventListener("click", () => {
  taskText.value = "";
});

el("btnHistoryClear").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

(async function init() {
  renderHistory();
  const h = await getHealth();
  print(h);
})();