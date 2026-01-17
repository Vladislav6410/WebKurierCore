// admin/codex.js
// Thin init layer. All logic lives in admin/codex-ui.js
// This file only maps Codex Console HTML ids to the shared controller.

(function () {
  // ✅ Replace with your repo branches page
  const GITHUB_BRANCHES_URL = "https://github.com/<USERNAME>/<REPO>/branches";

  // Guard: if codex-ui.js wasn't loaded, show a clear error
  if (!window.CodexUI || typeof window.CodexUI.initController !== "function") {
    const outEl = document.getElementById("output");
    if (outEl) {
      outEl.textContent =
        "Ошибка: CodexUI не найден. Проверь, что codex-ui.js подключён ПЕРЕД codex.js.";
    }
    return;
  }

  // Map Console UI -> shared controller
  const controller = window.CodexUI.initController({
    // elements
    outEl: document.getElementById("output"),       // <pre id="output">
    taskEl: document.getElementById("taskText"),    // <textarea id="taskText">
    packEl: document.getElementById("preset"),      // <select id="preset"> acts like packs
    reasonEl: document.getElementById("mode"),      // <select id="mode"> used as "reasoning" placeholder
    baseEl: null,                                  // no server URL input in this console
    sessionLineEl: null,                            // no session line in console

    // buttons
    btnHealth: document.getElementById("btnHealth"),
    btnInsert: null,                                // no "insert" button in console; preset change can fill task
    btnRun: document.getElementById("btnSend"),      // Send == Run
    btnCopyCurl: document.getElementById("btnCopy"), // Copy button copies CURL (better for iPhone debugging)
    btnClear: document.getElementById("btnClear"),
    btnLastSession: null,                            // console has no last-session button
    btnOpenBranches: null,                           // console has no branches button

    branchesUrl: GITHUB_BRANCHES_URL,
    storageKey: "wk-codex-session",
  });

  // --- Small glue specific to this Console page (still "thin") ---

  // 1) Make preset selection immediately fill taskText (like before)
  const presetEl = document.getElementById("preset");
  const taskEl = document.getElementById("taskText");
  if (presetEl && taskEl) {
    presetEl.addEventListener("change", () => {
      const key = presetEl.value;
      if (!key) return;
      // packs are defined in codex-ui.js (DEFAULT_PACKS + overrides)
      // In your console HTML, preset values are "plan_run_api", "secure_gate", ...
      // If not present in DEFAULT_PACKS, task becomes empty — that's expected until you add same keys to packs.
      const txt = (controller && controller.packs && controller.packs[key]) ? controller.packs[key] : "";
      taskEl.value = txt;
      // show hint in output area
      const outEl = document.getElementById("output");
      if (outEl) outEl.textContent = txt ? ("Preset loaded: " + key) : ("Нет текста для preset: " + key + " (добавь pack в codex-ui.js)");
    });
  }

  // 2) Ping button: set taskText="ping" then click Send/Run
  const btnPing = document.getElementById("btnPing");
  const btnSend = document.getElementById("btnSend");
  if (btnPing && taskEl && btnSend) {
    btnPing.addEventListener("click", () => {
      taskEl.value = "ping";
      btnSend.click();
    });
  }

  // 3) apiPill status: reuse /health on load (optional)
  //    We do not add new network logic here. Just click existing handler after DOM settles.
  const apiPill = document.getElementById("apiPill");
  const btnHealth = document.getElementById("btnHealth");
  if (apiPill && btnHealth) {
    // set initial state quickly
    apiPill.textContent = "…";
    apiPill.className = "pill";
    // trigger health check once
    setTimeout(() => btnHealth.click(), 50);
  }
})();