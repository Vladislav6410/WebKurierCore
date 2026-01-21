// admin/codex.js
// Init for admin/codex.html using shared window.CodexUI (admin/codex-ui.js)
// Matches your HTML ids: apiPill, btnHealth, btnPing, preset, mode, taskText,
// btnSend, btnCopy, btnSave, btnClear, output, history, btnHistoryClear

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ---- UI refs (from your HTML) ----
  const apiPill = $("apiPill");
  const btnHealth = $("btnHealth");
  const btnPing = $("btnPing");

  const presetEl = $("preset");
  const modeEl = $("mode");
  const taskEl = $("taskText");

  const btnSend = $("btnSend");
  const btnCopy = $("btnCopy");
  const btnSave = $("btnSave");
  const btnClear = $("btnClear");

  const outputEl = $("output");

  const historyEl = $("history");
  const btnHistoryClear = $("btnHistoryClear");

  // ---- Settings ----
  const BASE_URL = ""; // empty => use same origin
  const STORAGE_SESSION_KEY = "wk-codex-session";

  const HISTORY_KEY = "wk-codex-history-v1";
  const HISTORY_LIMIT = 30;

  const LAST_TASK_KEY = "wk-codex-last-task";

  // ---- Presets (your dropdown) ----
  const PRESETS = {
    plan_run_api: [
      "TARGET: WebKurierCore | api/codex-run.js",
      "TASK: CREATE | Реализовать POST /api/codex/run (stub) и вернуть JSON { ok:true, output_text }.",
      "CONSTRAINTS: 1 файл, без опасных операций, без чтения секретов, без удаления.",
      "OUTPUT: путь файла + полный код."
    ].join("\n"),
    secure_gate: [
      "TARGET: WebKurierCore | api/codex-run.js",
      "TASK: PATCH | Добавить security gate: denylist + лимит taskText + понятные ошибки.",
      "CONSTRAINTS: не ломать существующую логику, вернуть JSON { ok:false, error } при блокировке.",
      "OUTPUT: показать только изменения Было/Стало."
    ].join("\n"),
    smoke: [
      "Сделай smoke-check проекта:",
      "1) /health отвечает ok",
      "2) /admin/status.html открывается",
      "3) POST /api/codex/run отвечает ok на ping",
      "Если что-то ломается — дай 3 минимальных патча."
    ].join("\n"),
    agent_tiles: [
      "Проверь UI портала агентов:",
      "1) где читается agents_map.json",
      "2) как рендерятся плитки",
      "3) минимальный патч, чтобы новые агенты появлялись автоматически."
    ].join("\n"),
    terminal_router: [
      "Проверь Terminal router:",
      "1) где лежит commands_map.json",
      "2) как роутятся команды",
      "3) 3 безопасных улучшения (валидация, help, ошибки)."
    ].join("\n")
  };

  // ---- Helpers ----
  function setPill(ok, text) {
    if (!apiPill) return;
    apiPill.textContent = text || "…";
    apiPill.classList.remove("ok", "bad");
    apiPill.classList.add(ok ? "ok" : "bad");
  }

  function setOutput(text) {
    if (!outputEl) return;
    outputEl.textContent = text || "—";
  }

  function requireCodexUI() {
    if (!window.CodexUI) {
      setOutput("Ошибка: CodexUI не загружен. Проверь, что в конце HTML подключены:\n" +
        "1) /admin/codex-ui.js\n" +
        "2) /admin/codex.js\n" +
        "и что /admin/codex-ui.js не отдаёт 404.");
      return false;
    }
    return true;
  }

  function getReasoningFromMode() {
    // Plan => cheaper; Run => more careful
    const mode = (modeEl && modeEl.value) ? modeEl.value : "plan";
    return mode === "run" ? "medium" : "low";
  }

  function getBaseUrl() {
    // If BASE_URL empty, use same origin.
    const base = (BASE_URL && BASE_URL.trim()) ? BASE_URL.trim() : window.location.origin;
    return base.replace(/\/+$/, "");
  }

  function readLastTask() {
    try { return localStorage.getItem(LAST_TASK_KEY) || ""; } catch { return ""; }
  }

  function writeLastTask(text) {
    try { localStorage.setItem(LAST_TASK_KEY, String(text || "")); } catch {}
  }

  // ---- History ----
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
    } catch {}
  }

  function addHistory(text) {
    const t = String(text || "").trim();
    if (!t) return;

    const items = loadHistory().filter(Boolean);

    // de-dup exact text
    const filtered = items.filter((x) => x && x.text !== t);
    filtered.unshift({ text: t, at: new Date().toISOString() });
    saveHistory(filtered);
  }

  function deleteHistoryAt(index) {
    const items = loadHistory().filter(Boolean);
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    saveHistory(items);
  }

  function clearHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }

  function renderHistory() {
    if (!historyEl) return;
    const items = loadHistory().filter((x) => x && typeof x.text === "string" && x.text.trim());

    if (!items.length) {
      historyEl.innerHTML = `<div class="hint">История пуста.</div>`;
      return;
    }

    historyEl.innerHTML = "";
    items.forEach((item, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.style.marginTop = "10px";

      const top = document.createElement("div");
      top.className = "row";
      top.style.justifyContent = "space-between";

      const meta = document.createElement("div");
      meta.className = "sub";
      meta.textContent = `#${idx + 1} · ${item.at || ""}`;

      const actions = document.createElement("div");
      actions.className = "row";

      const btnInsert = document.createElement("button");
      btnInsert.className = "btn";
      btnInsert.textContent = "↩️ Вставить";
      btnInsert.addEventListener("click", () => {
        if (taskEl) taskEl.value = item.text || "";
        writeLastTask(item.text || "");
        setOutput("Задача вставлена из истории.");
      });

      const btnCopyItem = document.createElement("button");
      btnCopyItem.className = "btn";
      btnCopyItem.textContent = "📋 Копировать";
      btnCopyItem.addEventListener("click", async () => {
        if (!requireCodexUI()) return;
        const ok = await window.CodexUI.copyToClipboard(item.text || "");
        setOutput(ok ? "Скопировано ✅" : "Не удалось скопировать автоматически (iOS).");
      });

      const btnDeleteItem = document.createElement("button");
      btnDeleteItem.className = "btn";
      btnDeleteItem.textContent = "🗑";
      btnDeleteItem.title = "Удалить из истории";
      btnDeleteItem.addEventListener("click", () => {
        deleteHistoryAt(idx);
        renderHistory();
        setOutput("Удалено из истории.");
      });

      actions.appendChild(btnInsert);
      actions.appendChild(btnCopyItem);
      actions.appendChild(btnDeleteItem);

      top.appendChild(meta);
      top.appendChild(actions);

      const pre = document.createElement("pre");
      pre.textContent = item.text || "—";

      wrap.appendChild(top);
      wrap.appendChild(pre);

      historyEl.appendChild(wrap);
    });
  }

  // ---- CodexUI controller (bind shared logic) ----
  // We keep controller mainly to reuse chunking config.
  let controller = null;
  function initSharedController() {
    if (!requireCodexUI()) return null;

    controller = window.CodexUI.initController({
      outEl: outputEl,
      taskEl: taskEl,
      packEl: null,
      reasonEl: null,
      baseEl: null,
      storageKey: STORAGE_SESSION_KEY,
      btnHealth: null,
      btnInsert: null,
      btnRun: null,
      btnCopyCurl: null,
      btnClear: null,
      btnLastSession: null,

      chunking: {
        maxChunkChars: 7200,
        interChunkDelayMs: 200,
        addChunkHeader: true
      }
    });

    return controller;
  }

  // ---- API actions ----
  async function doHealth() {
    if (!requireCodexUI()) return false;

    setPill(false, "…");
    // Use shared checkHealth so behavior matches codex-ui.js (rev2)
    const ok = await window.CodexUI.checkHealth({
      baseUrl: getBaseUrl(),
      outEl: outputEl
    });

    setPill(!!ok, ok ? "OK" : "FAIL");
    return !!ok;
  }

  async function doSend() {
    if (!requireCodexUI()) return { ok: false, error: "CodexUI not loaded" };
    if (!controller) initSharedController();

    const text = (taskEl && taskEl.value) ? taskEl.value : "";
    const trimmed = String(text || "").trim();
    const reasoning = getReasoningFromMode();
    const sessionId = window.CodexUI.ensureSessionId(STORAGE_SESSION_KEY);

    writeLastTask(text);

    const res = await window.CodexUI.runCodexAuto({
      baseUrl: getBaseUrl(),
      outEl: outputEl,
      taskText: text,
      reasoning,
      sessionId,
      chunking: (controller && controller.chunking) ? controller.chunking : undefined
    });

    // pill update
    if (res && res.ok) setPill(true, "OK");
    else setPill(false, "FAIL");

    // мягкое автосохранение: если не ping и есть текст
    if (trimmed && trimmed.toLowerCase() !== "ping") {
      addHistory(trimmed);
      renderHistory();
    }

    return res;
  }

  async function doCopy() {
    if (!requireCodexUI()) return;

    const sessionId = window.CodexUI.ensureSessionId(STORAGE_SESSION_KEY);
    const reasoning = getReasoningFromMode();
    const text = (taskEl && taskEl.value) ? taskEl.value.trim() : "ping";

    const curl = window.CodexUI.buildCurl({
      baseUrl: getBaseUrl(),
      taskText: text || "ping",
      reasoning,
      sessionId
    });

    const ok = await window.CodexUI.copyToClipboard(curl);
    setOutput(ok ? ("CURL скопирован ✅\n\n" + curl) : ("Не удалось скопировать автоматически (iOS).\n\n" + curl));
  }

  // ---- Bind UI ----
  if (btnHealth) btnHealth.addEventListener("click", doHealth);

  if (btnPing) btnPing.addEventListener("click", async () => {
    if (taskEl) taskEl.value = "ping";
    writeLastTask("ping");
    await doSend();
  });

  if (presetEl) {
    presetEl.addEventListener("change", () => {
      const key = presetEl.value || "";
      if (!key) return;
      const txt = PRESETS[key] || "";
      if (taskEl) taskEl.value = txt;
      writeLastTask(txt);
      setOutput("Preset вставлен: " + key);
    });
  }

  if (btnSend) btnSend.addEventListener("click", doSend);

  if (btnCopy) btnCopy.addEventListener("click", doCopy);

  if (btnSave) btnSave.addEventListener("click", () => {
    const t = (taskEl && taskEl.value) ? taskEl.value.trim() : "";
    if (!t) {
      setOutput("Нечего сохранять: поле задачи пустое.");
      return;
    }
    addHistory(t);
    renderHistory();
    setOutput("Сохранено в историю ✅");
  });

  if (btnClear) btnClear.addEventListener("click", () => {
    if (taskEl) taskEl.value = "";
    writeLastTask("");
    setOutput("Очищено.");
  });

  if (btnHistoryClear) btnHistoryClear.addEventListener("click", () => {
    clearHistory();
    renderHistory();
    setOutput("История очищена.");
  });

  // ---- Init ----
  // Restore last task if exists
  const last = readLastTask();
  if (last && taskEl && !taskEl.value) taskEl.value = last;

  initSharedController();
  renderHistory();

  // Quick health on load
  doHealth();

})();