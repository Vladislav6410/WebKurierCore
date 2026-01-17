// admin/codex-remote.js
// Thin init layer. All logic lives in admin/codex-ui.js

(function () {
  // ✅ Replace with your repo branches page
  const GITHUB_BRANCHES_URL = "https://github.com/<USERNAME>/<REPO>/branches";

  // Guard: if codex-ui.js wasn't loaded, show a clear error
  if (!window.CodexUI || typeof window.CodexUI.initController !== "function") {
    const outEl = document.getElementById("codexMiniOut");
    if (outEl) {
      outEl.textContent =
        "Ошибка: CodexUI не найден. Проверь, что codex-ui.js подключён ПЕРЕД codex-remote.js.";
      outEl.classList.remove("ok");
      outEl.classList.add("bad");
    }
    return;
  }

  window.CodexUI.initController({
    // elements
    outEl: document.getElementById("codexMiniOut"),
    taskEl: document.getElementById("codexTaskMini"),
    packEl: document.getElementById("codexPackMini"),
    reasonEl: document.getElementById("codexReasonMini"),
    baseEl: document.getElementById("serverBaseMini"),
    sessionLineEl: document.getElementById("sessionLine"),

    // buttons
    btnHealth: document.getElementById("btnHealthMini"),
    btnInsert: document.getElementById("btnInsertPackMini"),
    btnRun: document.getElementById("btnRunCodexMini"),
    btnCopyCurl: document.getElementById("btnCopyCurlMini"),
    btnClear: document.getElementById("btnClearCodexMini"),
    btnLastSession: document.getElementById("btnLastSessionMini"),
    btnOpenBranches: document.getElementById("btnOpenBranches"),

    // config
    branchesUrl: GITHUB_BRANCHES_URL,
    storageKey: "wk-codex-session",
  });
})();