const API = {
  health: "/health",
  run: "/api/codex/run",
};

const $ = (id) => document.getElementById(id);

const apiPill = $("apiPill");
const output = $("output");
const preset = $("preset");
const mode = $("mode");
const taskText = $("taskText");
const historyBox = $("history");

const STORAGE_KEY = "wk_codex_history_v1";
const MAX_HISTORY = 30;

function setPill(text, ok) {
  apiPill.textContent = text;
  apiPill.className = "pill " + (ok ? "ok" : "bad");
}

function print(obj) {
  output.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

async function getJSON(url) {
  const r = await fetch(url);
  const t = await r.text();
  let body;
  try { body = JSON.parse(t); } catch { body = { raw: t }; }
  return { ok: r.ok, status: r.status, body };
}

async function postJSON(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const t = await r.text();
  let body;
  try { body = JSON.parse(t); } catch { body = { raw: t }; }
  return { ok: r.ok, status: r.status, body };
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

function addHistory(entry) {
  const items = loadHistory();
  items.unshift(entry);
  saveHistory(items);
  renderHistory();
}

function renderHistory() {
  const items = loadHistory();
  if (!items.length) {
    historyBox.innerHTML = `<div style="color:#9ca3af;font-size:12px;">Пока пусто</div>`;
    return;
  }

  historyBox.innerHTML = items.map((it, idx) => {
    const dt = new Date(it.ts).toLocaleString();
    const safe = (it.taskText || "").replace(/[<>&]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[c]));
    const badge = it.ok ? "ok:true" : "ok:false";

    return `
      <div style="margin-top:10px;border:1px solid #243047;border-radius:12px;padding:10px;background:#0f172a;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <div style="color:#e5e7eb;font-weight:700;">${(it.mode || "run").toUpperCase()} · ${dt}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="font-size:12px;color:#9ca3af;border:1px solid #243047;border-radius:999px;padding:4px 10px;">${it.status}</span>
            <span style="font-size:12px;color:#9ca3af;border:1px solid #243047;border-radius:999px;padding:4px 10px;">${badge}</span>
          </div>
        </div>
        <pre style="margin:8px 0 0;white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.35;">${safe}</pre>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          <button class="btn" data-act="use" data-idx="${idx}">↩️ Вставить</button>
          <button class="btn" data-act="copy" data-idx="${idx}">📋 Копировать</button>
          <button class="btn danger" data-act="del" data-idx="${idx}">🧹 Удалить</button>
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
        renderHistory();
      }
    });
  });
}

const PRESETS = {
  plan_run_api: `Implement POST /api/codex/run in the Node/Express server.
Requirements:
- Accept JSON: { "taskText": string, "mode": "plan"|"run" }
- Validate: taskText required, max 20000 chars, reject payload > 50kb
- Response JSON: { ok:true, output_text:string, meta?:object }
- For now: stub behavior
  - ping -> pong
  - otherwise -> "ACK (limited): " + first 2000 chars
- Update README with curl example.
Keep changes minimal.`,
  secure_gate: `Add a SAFE execution gate for POST /api/codex/run:
- Block dangerous patterns: rm -rf, sudo, mkfs, dd, shutdown, reboot, curl|bash, wget|bash
- Block reading secrets: .env, secrets.json, id_rsa, authorized_keys
- Return 400 with clear error message.
Add minimal self-check tests.`,
  smoke: `Add a smoke check endpoint or script:
- Verify GET /health
- Verify GET /api/status (if exists)
- Verify POST /api/codex/run ping
Provide clear pass/fail output.`,
  agent_tiles: `Ensure agents menu UI is fully driven by engine/config/agents_map.json.
- No hardcoded tiles
- Render groups and agent chips
- Respect access tiers`,
  terminal_router: `Implement command routing in terminal via engine/terminal/commands_map.json:
- Parse /help /agents /status
- Route commands to agent ids
- Print useful output`,
};

preset.addEventListener("change", () => {
  const key = preset.value;
  if (!key) return;
  taskText.value = PRESETS[key] || "";
  if (location.hash === "#new-task") location.hash = "";
});

$("btnHealth").addEventListener("click", async () => {
  print("Checking /health ...");
  try {
    const res = await getJSON(API.health);
    setPill(`${res.status} ${res.ok ? "OK" : "FAIL"}`, res.ok);
    print(res);
  } catch (e) {
    setPill("OFFLINE", false);
    print({ ok:false, error:String(e) });
  }
});

$("btnPing").addEventListener("click", async () => {
  print("POST /api/codex/run (ping) ...");
  try {
    const res = await postJSON(API.run, { taskText: "ping", mode: "run" });
    setPill(`${res.status} ${res.ok ? "OK" : "FAIL"}`, res.ok);
    print(res);
    addHistory({ ts: Date.now(), mode: "run", taskText: "ping", ok: res.ok, status: res.status });
  } catch (e) {
    setPill("OFFLINE", false);
    print({ ok:false, error:String(e) });
  }
});

$("btnSend").addEventListener("click", async () => {
  const text = (taskText.value || "").trim();
  const m = mode.value || "plan";

  if (!text) {
    print({ ok:false, error:{ code:"EMPTY", message:"taskText is empty" } });
    return;
  }

  print("Sending...");
  try {
    const res = await postJSON(API.run, { taskText: text, mode: m });
    setPill(`${res.status} ${res.ok ? "OK" : "FAIL"}`, res.ok);
    print(res);
    addHistory({ ts: Date.now(), mode: m, taskText: text, ok: res.ok, status: res.status });
  } catch (e) {
    setPill("OFFLINE", false);
    print({ ok:false, error:String(e) });
  }
});

$("btnCopy").addEventListener("click", async () => {
  await navigator.clipboard?.writeText(taskText.value || "");
});

$("btnSave").addEventListener("click", () => {
  const text = (taskText.value || "").trim();
  if (!text) return;
  addHistory({ ts: Date.now(), mode: mode.value || "plan", taskText: text, ok: true, status: "saved" });
});

$("btnClear").addEventListener("click", () => {
  taskText.value = "";
});

$("btnHistoryClear").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

(function init(){
  renderHistory();

  // auto-load preset when coming from "New task" link
  if (location.hash === "#new-task") {
    preset.value = "plan_run_api";
    taskText.value = PRESETS.plan_run_api;
  }

  // initial health ping
  fetch(API.health)
    .then(r => r.json().then(j => ({ ok:r.ok, status:r.status, body:j })).catch(() => ({ ok:r.ok, status:r.status, body:{} })))
    .then(res => setPill(`${res.status} ${res.ok ? "OK" : "FAIL"}`, res.ok))
    .catch(() => setPill("OFFLINE", false));
})();