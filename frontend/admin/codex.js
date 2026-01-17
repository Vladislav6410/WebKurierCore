// frontend/admin/codex.js
(function () {
  const el = (id) => document.getElementById(id);

  const apiUrl = "/api/codex/run";

  const packs = {
    ping: `ping`,
    scan_repo: [
      "Просканируй репозиторий и скажи:",
      "1) где реализован /api/codex/run и где он подключён в server",
      "2) какие файлы отвечают за UI /admin/codex.html",
      "3) какие следующие 3 улучшения сделать безопасно",
    ].join("\n"),
    add_codex_buttons: [
      "Найди index.html (портал) и добавь в top-actions кнопки Codex управления:",
      "- Codex Console (/admin/codex.html)",
      "- Проверка /health (как ссылка или мини-панель)",
      "Сделай минимально и безопасно. Проверь после патча (read_file).",
    ].join("\n"),
    chain_audit_check: [
      "Проверь цепочку аудита:",
      "1) где находится api/chain-audit.js",
      "2) куда пишутся события (jsonl) и как считаются хэши",
      "3) предложи минимальный статус-экран в /admin/logs.html для аудита codex",
    ].join("\n"),
    security_gate_check: [
      "Проверь security-gates для apply_patch:",
      "1) allowlist/denylist",
      "2) типичные причины блокировки",
      "3) предложи улучшение сообщений пользователю (понятный текст).",
    ].join("\n"),
    ui_console_check: [
      "Проверь frontend/admin/codex.html и codex.js:",
      "1) нет ли битых ссылок",
      "2) UX: что улучшить (минимально)",
      "3) предложи ещё 5 полезных кнопок для 'пульта'.",
    ].join("\n"),
    i18n_check: [
      "Проверь i18n-часть WebKurierCore:",
      "1) где хранится i18n.js/словарь",
      "2) как корректно добавить мультиязычный текст для Codex Console",
      "3) предложи минимальный план, без массовых правок.",
    ].join("\n"),
    terminal_hook_plan: [
      "Составь план интеграции Codex в Admin Terminal:",
      "1) как добавить команду /codex",
      "2) как логировать запросы (audit)",
      "3) как ограничить права (security gates).",
    ].join("\n"),
    report_status: [
      "Сделай короткий технический отчёт:",
      "- что уже реализовано по Codex",
      "- что проверить руками",
      "- 3 следующих шага (минимально рискованные).",
    ].join("\n"),
    bugs_find: [
      "Найди возможные ошибки:",
      "1) битые ссылки /admin/*",
      "2) неправильные пути в server/index.js",
      "3) несовпадения папок (frontend vs root).",
      "Дай список точных файлов и строк где исправить.",
    ].join("\n"),
  };

  function setSys(msg, ok = true) {
    const box = el("sys");
    box.textContent = msg || "—";
    box.classList.remove("statusOk", "statusBad");
    box.classList.add(ok ? "statusOk" : "statusBad");
  }

  function setOut(msg, ok = true) {
    const box = el("output");
    box.textContent = msg || "—";
    box.classList.remove("statusOk", "statusBad");
    box.classList.add(ok ? "statusOk" : "statusBad");
  }

  function setSession(sessionId) {
    el("sessionIdView").textContent = sessionId || "—";
  }

  function setLastHttp(code) {
    el("lastHttp").textContent = code ? String(code) : "—";
  }

  function openUrl(u) {
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLastHttp(res.status);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const err = data?.error || `HTTP ${res.status}`;
      throw new Error(err);
    }
    return data;
  }

  async function runCodex(taskText) {
    const reasoning = el("reasoning").value || "medium";

    // простая sessionId (локально в браузере)
    const sessionId = localStorage.getItem("wk-codex-session") || `wk_${Date.now()}`;
    localStorage.setItem("wk-codex-session", sessionId);
    setSession(sessionId);

    setSys("Отправляю задачу в /api/codex/run ...", true);
    setOut("—", true);

    const data = await postJson(apiUrl, {
      taskText,
      reasoning,
      sessionId,
    });

    setSys("Готово. Ответ получен.", true);
    setOut(data.output_text || "(пустой ответ)", true);
  }

  async function checkHealth() {
    setSys("Проверяю /health ...", true);
    setOut("—", true);
    try {
      const res = await fetch("/health");
      setLastHttp(res.status);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(`health not ok (HTTP ${res.status})`);
      setSys("Health OK ✅  сервер жив.", true);
      setOut(JSON.stringify(data, null, 2), true);
    } catch (e) {
      setSys(`Health FAIL: ${e.message}`, false);
      setOut(String(e.message || e), false);
    }
  }

  function buildCurl(taskText) {
    const reasoning = el("reasoning").value || "medium";
    const sessionId = localStorage.getItem("wk-codex-session") || `wk_${Date.now()}`;
    return [
      `curl -s http://localhost:3000/api/codex/run \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${JSON.stringify({ taskText, reasoning, sessionId }).replace(/'/g, "\\'")}'`,
    ].join("\n");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setSys("Скопировано в буфер обмена.", true);
    } catch (e) {
      setSys("Не удалось скопировать (iOS иногда блокирует). Выдели и скопируй вручную.", false);
    }
  }

  function insertPack() {
    const k = el("taskPack").value;
    if (!k) {
      setSys("Выбери пакет в списке.", false);
      return;
    }
    el("taskText").value = packs[k] || "";
    setSys(`Пакет вставлен: ${k}`, true);
  }

  function clearAll() {
    el("taskText").value = "";
    setOut("—", true);
    setSys("Очищено.", true);
  }

  function openRepo(where) {
    const repoUrl = (el("repoUrl").value || "").trim();
    if (!repoUrl) {
      setSys("Вставь URL репозитория в поле Repo URL.", false);
      return;
    }
    if (where === "repo") return openUrl(repoUrl);
    if (where === "prs") return openUrl(repoUrl.replace(/\/$/, "") + "/pulls");
    if (where === "branches") return openUrl(repoUrl.replace(/\/$/, "") + "/branches");
  }

  function openDeleteBranch() {
    const repoUrl = (el("repoUrl").value || "").trim();
    const branch = (el("branchName").value || "").trim();
    if (!repoUrl) {
      setSys("Вставь URL репозитория в поле Repo URL.", false);
      return;
    }
    if (!branch) {
      setSys("Вставь имя ветки (branchName).", false);
      return;
    }
    // Самый надёжный путь без API: открыть страницу веток, там удаление доступно.
    const u = repoUrl.replace(/\/$/, "") + "/branches";
    setSys(`Открою ветки. Найди ветку "${branch}" и нажми Delete.`, true);
    openUrl(u);
  }

  async function runQuick(kind) {
    if (kind === "report") return runCodex(packs.report_status);
    if (kind === "bugs") return runCodex(packs.bugs_find);
    if (kind === "audit") return runCodex([packs.security_gate_check, "", packs.chain_audit_check].join("\n"));
  }

  // Wire UI
  el("apiBase").textContent = apiUrl;

  el("btnRun").addEventListener("click", async () => {
    const taskText = (el("taskText").value || "").trim();
    if (!taskText) {
      setSys("Вставь текст задачи или выбери пакет → 'Вставить пакет'.", false);
      return;
    }
    try {
      await runCodex(taskText);
    } catch (e) {
      setSys(`Ошибка: ${e.message}`, false);
      setOut(String(e.message || e), false);
    }
  });

  el("btnUsePack").addEventListener("click", insertPack);
  el("btnClear").addEventListener("click", clearAll);

  el("btnCopyCurl").addEventListener("click", async () => {
    const taskText = (el("taskText").value || "").trim() || "ping";
    const curl = buildCurl(taskText);
    await copyToClipboard(curl);
    setOut(curl, true);
  });

  el("btnHealth").addEventListener("click", checkHealth);

  el("btnOpenRepo").addEventListener("click", () => openRepo("repo"));
  el("btnOpenPRs").addEventListener("click", () => openRepo("prs"));
  el("btnOpenBranches").addEventListener("click", () => openRepo("branches"));
  el("btnDeleteBranch").addEventListener("click", openDeleteBranch);

  el("btnReport").addEventListener("click", () => runQuick("report"));
  el("btnFindBugs").addEventListener("click", () => runQuick("bugs"));
  el("btnAudit").addEventListener("click", () => runQuick("audit"));

  // init
  setSys("Готово. Нажми “✅ Проверить /health” или выбери пакет [0] ping → “▶ Запустить”.", true);
  setSession(localStorage.getItem("wk-codex-session"));
})();