// admin/codex-remote.js

(function () {
  const packs = {
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

  const outEl = document.getElementById("codexMiniOut");
  const taskEl = document.getElementById("codexTaskMini");
  const packEl = document.getElementById("codexPackMini");
  const reasonEl = document.getElementById("codexReasonMini");
  const baseEl = document.getElementById("serverBaseMini");
  const sessionLine = document.getElementById("sessionLine");

  // ✅ GitHub branches URL (поменяй на свой репозиторий)
  const GITHUB_BRANCHES_URL = "https://github.com/<USERNAME>/<REPO>/branches";
  const branchesBtn = document.getElementById("btnOpenBranches");
  if (branchesBtn) branchesBtn.href = GITHUB_BRANCHES_URL;

  function setOut(text, ok=true){
    outEl.textContent = text || "—";
    outEl.classList.remove("ok","bad");
    outEl.classList.add(ok ? "ok" : "bad");
  }

  function getSessionId(){
    const sid = localStorage.getItem("wk-codex-session");
    return sid || null;
  }

  function ensureSessionId(){
    let sid = getSessionId();
    if(!sid){
      sid = "wk_" + Date.now();
      localStorage.setItem("wk-codex-session", sid);
    }
    sessionLine.textContent = "sessionId: " + sid;
    return sid;
  }

  function apiUrl(path){
    const base = (baseEl?.value || "").trim() || "http://localhost:3000";
    return base.replace(/\/+$/,"") + path;
  }

  async function checkHealth(){
    setOut("Проверяю /health ...");
    try{
      const res = await fetch(apiUrl("/health"));
      const data = await res.json().catch(() => ({}));
      if(!res.ok || !data.ok) throw new Error("health not ok");
      setOut("Health OK ✅  " + JSON.stringify(data));
    }catch(e){
      setOut("Health FAIL: " + (e.message || e), false);
    }
  }

  async function runCodex(){
    const taskText = (taskEl.value || "").trim();
    if(!taskText){
      setOut("Вставь задачу: выбери пакет → Вставить → Run.", false);
      return;
    }
    const reasoning = reasonEl.value || "medium";
    const sessionId = ensureSessionId();

    setOut("Отправляю задачу в /api/codex/run ...");
    try{
      const res = await fetch(apiUrl("/api/codex/run"), {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ taskText, reasoning, sessionId })
      });
      const data = await res.json().catch(() => ({}));
      if(!res.ok || !data.ok) throw new Error(data.error || ("HTTP " + res.status));
      setOut(data.output_text || "(пустой ответ)", true);
    }catch(e){
      setOut("Ошибка Codex: " + (e.message || e), false);
    }
  }

  function insertPack(){
    const k = packEl.value;
    if(!k){ setOut("Выбери пакет в списке.", false); return; }
    taskEl.value = packs[k] || "";
    setOut("Пакет вставлен: " + k);
  }

  function clearAll(){
    taskEl.value = "";
    setOut("Очищено.");
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      try{
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
      }catch(e2){
        return false;
      }
    }
  }

  function buildCurl(taskText){
    const reasoning = reasonEl.value || "medium";
    const sessionId = ensureSessionId();
    const base = (baseEl?.value || "").trim() || "http://localhost:3000";
    const payload = { taskText, reasoning, sessionId };
    return [
      "curl -s " + base.replace(/\/+$/,"") + "/api/codex/run \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '" + JSON.stringify(payload).replace(/'/g, "\\'") + "'"
    ].join("\n");
  }

  async function copyCurl(){
    const taskText = (taskEl.value || "").trim() || "ping";
    const curl = buildCurl(taskText);
    const ok = await copyToClipboard(curl);
    if(ok){
      setOut("CURL скопирован ✅\n\n" + curl, true);
    }else{
      setOut("Не удалось скопировать автоматически (iOS). Вот CURL — выдели и скопируй вручную:\n\n" + curl, false);
    }
  }

  function showLastSession(){
    const sid = getSessionId();
    if(!sid){
      setOut("Нет sessionId. Сначала нажми ▶ Run хотя бы один раз.", false);
      return;
    }
    sessionLine.textContent = "sessionId: " + sid;

    const taskText = (taskEl.value || "").trim() || "ping";
    const curl = buildCurl(taskText);
    setOut("Последняя сессия Codex ✅\n\nsessionId = " + sid + "\n\nCURL:\n" + curl, true);
  }

  document.getElementById("btnHealthMini")?.addEventListener("click", checkHealth);
  document.getElementById("btnInsertPackMini")?.addEventListener("click", insertPack);
  document.getElementById("btnRunCodexMini")?.addEventListener("click", runCodex);
  document.getElementById("btnCopyCurlMini")?.addEventListener("click", copyCurl);
  document.getElementById("btnLastSessionMini")?.addEventListener("click", showLastSession);
  document.getElementById("btnClearCodexMini")?.addEventListener("click", clearAll);

  // init
  ensureSessionId();
})();