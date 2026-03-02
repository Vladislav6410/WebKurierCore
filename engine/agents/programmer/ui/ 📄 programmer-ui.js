/* programmer-ui.js
   UI слой ProgrammerAgent
   - хранит lastPatch
   - делает apply через /api/programmer/apply_patch
   - отдаёт глобальные хуки для programmer-agent.js
*/

let lastPatch = null;

/* -----------------------------------
   UI Helper (если addMsg существует — используем его,
   иначе выводим в console)
----------------------------------- */
function uiLog(role, text) {
  if (typeof addMsg === "function") {
    addMsg(role, text);
  } else {
    console.log(`[${role}]`, text);
  }
}

/* -----------------------------------
   Установка патча из LLM / генерации
----------------------------------- */
export function setLastPatch(patchObject) {
  lastPatch = patchObject;
}

/* -----------------------------------
   Apply patch через Core → WDA
----------------------------------- */
async function applyPatch() {

  if (!lastPatch || !lastPatch.unifiedDiff) {
    uiLog("system", "❌ Нет патча для применения");
    return;
  }

  let response;

  try {
    response = await fetch("/api/programmer/apply_patch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "WebKurierCore",
        unifiedDiff: lastPatch.unifiedDiff
      })
    });
  } catch (err) {
    uiLog("system", `❌ Network error: ${String(err?.message || err)}`);
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    uiLog("system", `❌ Неверный JSON от сервера (HTTP ${response?.status})`);
    return;
  }

  if (data.ok) {
    uiLog("system", "✅ Применено (через WDA)");
  } else {
    uiLog("system", `❌ ${data.error || "Ошибка применения"}`);
  }
}

/* -----------------------------------
   Доступ к diff для терминала / debug
----------------------------------- */
function getLastDiff() {
  return lastPatch?.unifiedDiff || "";
}

/* -----------------------------------
   Глобальные хуки для programmer-agent.js
----------------------------------- */
window.__WK_PROGRAMMER_APPLY_PATCH__ = applyPatch;
window.__WK_PROGRAMMER_LAST_DIFF__ = getLastDiff;

/* -----------------------------------
   Для отладки
----------------------------------- */
console.log("Programmer UI loaded ✅");