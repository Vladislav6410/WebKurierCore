// admin/codex-ui.js
// Shared UI logic for Codex Console + Codex Remote (no duplication).
// Exposes: window.CodexUI
//
// Update 2026-01: adds client-side chunking for long taskText (<= 8000 server limit).
// - Backward compatible: runCodex() still exists, onRun() can use runCodexAuto().
// - If taskText <= maxChunkChars -> single request
// - If longer -> split into chunks and send sequentially, aggregate outputs
//
// Update 2026-01 (rev2):
// - Treat HTTP 200 as success by default (if data.ok is missing), but still respect ok:false
// - Default baseUrl is current origin (not localhost)
// - More robust curl escaping + error extraction

(function () {
  const DEFAULT_PACKS = {
    ping: "ping",
    scan_repo: [
      "Просканируй репозиторий и скажи:",
      "1) где реализован /api/codex/run и где он подключён в server",
      "2) где лежит UI Codex Console и как он подцеплен",
      "3) 3 следующих безопасных улучшения",
    ].join("\n"),
    add_codex_buttons: [
      "Проверь, что на главной странице есть мини-пульт Codex и кнопка Codex Console.",
      "Если чего-то нет — предложи минимальный патч.",
    ].join("\n"),
    security_audit: [
      "Проверь security-gates и chain-audit:",
      "1) allowlist/denylist",
      "2) куда пишется auditEvent",
      "3) что улучшить в сообщениях об отказе security gate",
    ].join("\n"),
    bugs_find: [
      "Найди ошибки:",
      "1) битые ссылки /admin/*",
      "2) несовпадение путей frontend/static",
      "3) что может ломать /api/codex/run",
    ].join("\n"),
    report_status: [
      "Сделай короткий отчёт:",
      "- что уже реализовано по Codex",
      "- что проверить руками",
      "- 3 следующих шага (минимально рискованные).",
    ].join("\n"),
  };

  function $(id) { return document.getElementById(id); }

  function setOut(outEl, text, ok = true) {
    if (!outEl) return;
    outEl.textContent = text || "—";
    outEl.classList.remove("ok", "bad");
    outEl.classList.add(ok ? "ok" : "bad");
  }

  function getSessionId(storageKey = "wk-codex-session") {
    return localStorage.getItem(storageKey) || null;
  }

  function ensureSessionId(storageKey = "wk-codex-session") {
    let sid = getSessionId(storageKey);
    if (!sid) {
      sid = "wk_" + Date.now();
      localStorage.setItem(storageKey, sid);
    }
    return sid;
  }

  function defaultBaseUrl() {
    // Prefer same origin (works on VM/domain). Fallback to localhost for dev.
    try {
      if (window && window.location && window.location.origin) return window.location.origin;
    } catch (e) {}
    return "http://localhost:3000";
  }

  function apiUrl(baseUrl, path) {
    const base = (baseUrl || "").trim() || defaultBaseUrl();
    return base.replace(/\/+$/, "") + path;
  }

  async function copyToClipboard(text) {
    // iOS/Safari sometimes blocks navigator.clipboard — fallback to execCommand.
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.left = "-1000px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  // bash-safe single-quote escaping: ' -> '\'' (close, escape, reopen)
  function bashSingleQuoteEscape(s) {
    return String(s).replace(/'/g, "'\\''");
  }

  function buildCurl({ baseUrl, taskText, reasoning, sessionId }) {
    const payload = { taskText, reasoning, sessionId };
    const base = (baseUrl || "").trim() || defaultBaseUrl();
    const json = bashSingleQuoteEscape(JSON.stringify(payload));
    return [
      "curl -s " + base.replace(/\/+$/, "") + "/api/codex/run \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '" + json + "'"
    ].join("\n");
  }

  function extractErrorMessage(data, httpStatus) {
    if (data == null) return "HTTP " + httpStatus;
    if (typeof data === "string") return data || ("HTTP " + httpStatus);
    if (typeof data === "object") {
      return data.error || data.message || ("HTTP " + httpStatus);
    }
    return String(data);
  }

  function normalizeResponse(data) {
    if (data == null) return "";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      return (
        data.output_text ||
        data.output ||
        data.result ||
        data.text ||
        data.message ||
        JSON.stringify(data, null, 2)
      );
    }
    return String(data);
  }

  function isOkResponse(res, data) {
    // Consider HTTP OK success unless explicit ok:false is present.
    if (!res || !res.ok) return false;
    if (data && typeof data === "object" && data.ok === false) return false;
    return true;
  }

  async function checkHealth({ baseUrl, outEl }) {
    setOut(outEl, "Проверяю /health ...");
    try {
      const res = await fetch(apiUrl(baseUrl, "/health"));
      const data = await res.json().catch(() => ({}));

      const ok = isOkResponse(res, data) && (data.ok === true || typeof data.ok === "undefined");
      if (!ok) throw new Error(extractErrorMessage(data, res.status) || "health not ok");

      setOut(outEl, "Health OK ✅  " + JSON.stringify(data), true);
      return true;
    } catch (e) {
      setOut(outEl, "Health FAIL: " + (e.message || e), false);
      return false;
    }
  }

  // ---------------------------
  // Chunking
  // ---------------------------

  const DEFAULT_CHUNKING = {
    // Server hard limit: 8000; keep margin for wrapper and JSON
    maxChunkChars: 7200,
    interChunkDelayMs: 200,
    // Put minimal context wrapper so Codex understands sequencing
    addChunkHeader: true,
  };

  function chunkText(rawText, maxChars) {
    const t = String(rawText || "").trim();
    if (!t) return [];
    if (t.length <= maxChars) return [t];

    const chunks = [];
    let cursor = 0;

    while (cursor < t.length) {
      const remaining = t.length - cursor;
      if (remaining <= maxChars) {
        const tail = t.slice(cursor).trim();
        if (tail) chunks.push(tail);
        break;
      }

      const window = t.slice(cursor, cursor + maxChars);

      // Prefer split points near the end
      const candidates = [
        window.lastIndexOf("\n\n"),
        window.lastIndexOf("\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("! "),
        window.lastIndexOf("? "),
        window.lastIndexOf("; "),
      ].filter((i) => i > 120); // avoid too tiny chunks

      let cut = -1;
      if (candidates.length) cut = Math.max.apply(null, candidates);
      if (cut === -1) cut = maxChars;

      const part = t.slice(cursor, cursor + cut).trim();
      if (part) chunks.push(part);

      cursor = cursor + cut;
      while (cursor < t.length && /\s/.test(t[cursor])) cursor++;
    }

    return chunks.filter(Boolean);
  }

  function buildChunkEnvelope(chunk, idx, total) {
    const header =
      "CHUNK " + (idx + 1) + "/" + total + "\n" +
      "RULES:\n" +
      "- Это часть большого задания. Не повторяй предыдущие части.\n" +
      "- Если критически не хватает контекста, попроси прислать предыдущий chunk.\n" +
      "---\n";
    return header + chunk;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ---------------------------
  // Codex API calls
  // ---------------------------

  async function runCodex({ baseUrl, outEl, taskText, reasoning, sessionId }) {
    const t = (taskText || "").trim();
    if (!t) {
      setOut(outEl, "Вставь задачу: выбери пакет → Вставить → Run.", false);
      return { ok: false, error: "empty taskText" };
    }

    setOut(outEl, "Отправляю задачу в /api/codex/run ...");
    try {
      const res = await fetch(apiUrl(baseUrl, "/api/codex/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskText: t, reasoning, sessionId })
      });

      // Accept JSON or text
      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return txt ? { message: txt } : {};
      });

      if (!isOkResponse(res, data)) {
        throw new Error(extractErrorMessage(data, res.status));
      }

      setOut(outEl, normalizeResponse(data) || "(пустой ответ)", true);
      return { ok: true, data };
    } catch (e) {
      setOut(outEl, "Ошибка Codex: " + (e.message || e), false);
      return { ok: false, error: e.message || String(e) };
    }
  }

  async function runCodexAuto({
    baseUrl,
    outEl,
    taskText,
    reasoning,
    sessionId,
    chunking,
    progressEl,
    onProgress
  }) {
    const t = (taskText || "").trim();
    if (!t) {
      setOut(outEl, "Вставь задачу: выбери пакет → Вставить → Run.", false);
      return { ok: false, error: "empty taskText" };
    }

    const cfg = Object.assign({}, DEFAULT_CHUNKING, chunking || {});
    const chunksRaw = chunkText(t, cfg.maxChunkChars);
    const total = chunksRaw.length || 0;

    function progress(i, msg) {
      if (progressEl) progressEl.textContent = (total ? (i + "/" + total) : "");
      if (typeof onProgress === "function") onProgress({ i, total, msg });
    }

    if (total <= 1) {
      progress(1, "single");
      return await runCodex({ baseUrl, outEl, taskText: t, reasoning, sessionId });
    }

    setOut(outEl, "Задание большое: отправляю частями (" + total + " chunks) ...", true);
    progress(0, "start");

    const outputs = [];
    for (let idx = 0; idx < total; idx++) {
      const chunk = cfg.addChunkHeader
        ? buildChunkEnvelope(chunksRaw[idx], idx, total)
        : chunksRaw[idx];

      progress(idx + 1, "sending");
      setOut(outEl, "Отправляю chunk " + (idx + 1) + "/" + total + " ...", true);

      try {
        const res = await fetch(apiUrl(baseUrl, "/api/codex/run"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskText: chunk, reasoning, sessionId })
        });

        const data = await res.json().catch(async () => {
          const txt = await res.text().catch(() => "");
          return txt ? { message: txt } : {};
        });

        if (!isOkResponse(res, data)) {
          const errMsg = extractErrorMessage(data, res.status);
          setOut(outEl, "Ошибка на chunk " + (idx + 1) + "/" + total + ": " + errMsg, false);
          return { ok: false, error: errMsg, failed_chunk: idx + 1, total_chunks: total, data };
        }

        const outText = normalizeResponse(data);
        outputs.push("### RESPONSE " + (idx + 1) + "/" + total + "\n" + (outText || "(пустой ответ)"));

        if (idx < total - 1) await sleep(cfg.interChunkDelayMs);

      } catch (e) {
        const err = e.message || String(e);
        setOut(outEl, "Сетевая ошибка на chunk " + (idx + 1) + "/" + total + ": " + err, false);
        return { ok: false, error: err, failed_chunk: idx + 1, total_chunks: total };
      }
    }

    const merged = outputs.join("\n\n");
    setOut(outEl, merged || "(пустой ответ)", true);
    progress(total, "done");

    return { ok: true, data: { output_text: merged, chunks: total } };
  }

  function applyBranchesLink(branchBtn, branchesUrl) {
    if (!branchBtn) return;
    if (!branchesUrl) return;
    branchBtn.href = branchesUrl;
  }

  function hydratePacksSelect(packEl, packs) {
    if (!packEl) return;

    const hasRealOptions = packEl.options && packEl.options.length > 1;
    if (hasRealOptions) return;

    const keys = Object.keys(packs || {});
    if (!keys.length) return;

    keys.forEach((key, idx) => {
      const opt = document.createElement("option");
      opt.value = key;
      const nice = key.replace(/_/g, " ");
      opt.textContent = `[C${idx + 1}] ${nice}`;
      packEl.appendChild(opt);
    });
  }

  function initController(config) {
    const cfg = config || {};
    const packs = Object.assign({}, DEFAULT_PACKS, cfg.packs || {});
    const storageKey = cfg.storageKey || "wk-codex-session";

    const outEl = cfg.outEl;
    const taskEl = cfg.taskEl;
    const packEl = cfg.packEl;
    const reasonEl = cfg.reasonEl;
    const baseEl = cfg.baseEl;
    const sessionLineEl = cfg.sessionLineEl;
    const progressEl = cfg.progressEl;

    const btnHealth = cfg.btnHealth;
    const btnInsert = cfg.btnInsert;
    const btnRun = cfg.btnRun;
    const btnCopyCurl = cfg.btnCopyCurl;
    const btnClear = cfg.btnClear;
    const btnLastSession = cfg.btnLastSession;
    const btnOpenBranches = cfg.btnOpenBranches;

    hydratePacksSelect(packEl, packs);

    function getBaseUrl() {
      return (baseEl && baseEl.value) ? baseEl.value.trim() : (cfg.baseUrl || defaultBaseUrl());
    }

    function updateSessionLine() {
      if (!sessionLineEl) return;
      const sid = ensureSessionId(storageKey);
      sessionLineEl.textContent = "sessionId: " + sid;
    }

    function insertPack() {
      const key = (packEl && packEl.value) ? packEl.value : "";
      if (!key) {
        setOut(outEl, "Выбери пакет в списке.", false);
        return;
      }
      if (taskEl) taskEl.value = packs[key] || "";
      setOut(outEl, "Пакет вставлен: " + key, true);
    }

    function clearAll() {
      if (taskEl) taskEl.value = "";
      setOut(outEl, "Очищено.", true);
      if (progressEl) progressEl.textContent = "";
    }

    async function onHealth() {
      updateSessionLine();
      await checkHealth({ baseUrl: getBaseUrl(), outEl });
    }

    async function onRun() {
      const sessionId = ensureSessionId(storageKey);
      updateSessionLine();

      const chunkingCfg = Object.assign({}, DEFAULT_CHUNKING, cfg.chunking || {});
      await runCodexAuto({
        baseUrl: getBaseUrl(),
        outEl,
        taskText: taskEl ? taskEl.value : "",
        reasoning: reasonEl ? reasonEl.value : "medium",
        sessionId,
        chunking: chunkingCfg,
        progressEl,
      });
    }

    async function onCopyCurl() {
      const sessionId = ensureSessionId(storageKey);
      updateSessionLine();
      const curl = buildCurl({
        baseUrl: getBaseUrl(),
        taskText: (taskEl && taskEl.value) ? taskEl.value.trim() || "ping" : "ping",
        reasoning: reasonEl ? reasonEl.value : "medium",
        sessionId,
      });
      const ok = await copyToClipboard(curl);
      if (ok) setOut(outEl, "CURL скопирован ✅\n\n" + curl, true);
      else setOut(outEl, "Не удалось скопировать автоматически (iOS). Вот CURL — выдели и скопируй вручную:\n\n" + curl, false);
    }

    function onLastSession() {
      const sid = getSessionId(storageKey);
      if (!sid) {
        setOut(outEl, "Нет sessionId. Сначала нажми ▶ Run хотя бы один раз.", false);
        return;
      }
      updateSessionLine();
      const curl = buildCurl({
        baseUrl: getBaseUrl(),
        taskText: (taskEl && taskEl.value) ? taskEl.value.trim() || "ping" : "ping",
        reasoning: reasonEl ? reasonEl.value : "medium",
        sessionId: sid,
      });
      setOut(outEl, "Последняя сессия Codex ✅\n\nsessionId = " + sid + "\n\nCURL:\n" + curl, true);
    }

    if (btnHealth) btnHealth.addEventListener("click", onHealth);
    if (btnInsert) btnInsert.addEventListener("click", insertPack);
    if (btnRun) btnRun.addEventListener("click", onRun);
    if (btnCopyCurl) btnCopyCurl.addEventListener("click", onCopyCurl);
    if (btnClear) btnClear.addEventListener("click", clearAll);
    if (btnLastSession) btnLastSession.addEventListener("click", onLastSession);

    applyBranchesLink(btnOpenBranches, cfg.branchesUrl);

    updateSessionLine();

    return {
      packs,
      getBaseUrl,
      ensureSessionId: () => ensureSessionId(storageKey),
      getSessionId: () => getSessionId(storageKey),
      chunking: Object.assign({}, DEFAULT_CHUNKING, cfg.chunking || {}),
    };
  }

  window.CodexUI = {
    initController,
    DEFAULT_PACKS,
    DEFAULT_CHUNKING,
    buildCurl,
    copyToClipboard,
    ensureSessionId,
    getSessionId,
    checkHealth,
    runCodex,
    runCodexAuto,
    chunkText,
  };
})();