// admin/codex.js
// Thin init layer. All logic lives in admin/codex-ui.js

(function () {
  // ✅ WebKurierCore branches page (fixed)
  const GITHUB_BRANCHES_URL = "https://github.com/Vladislav6410/WebKurierCore/branches";

  window.CodexUI.initController({
    outEl: document.getElementById("codexMiniOut") || document.getElementById("out") || null,
    taskEl: document.getElementById("codexTaskMini") || document.getElementById("taskText") || null,
    packEl: document.getElementById("codexPackMini") || document.getElementById("packs") || null,
    reasonEl: document.getElementById("codexReasonMini") || document.getElementById("reasoning") || null,
    baseEl: document.getElementById("serverBaseMini") || document.getElementById("serverBase") || null,
    sessionLineEl: document.getElementById("sessionLine") || document.getElementById("sessionIdLine") || null,

    btnHealth: document.getElementById("btnHealthMini") || document.getElementById("btnHealth") || null,
    btnInsert: document.getElementById("btnInsertPackMini") || document.getElementById("