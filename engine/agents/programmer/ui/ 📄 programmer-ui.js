async function applyPatch() {
  if (!lastPatch?.unifiedDiff) { addMsg("system","Нет патча"); return; }

  const resp = await fetch("/api/programmer/apply_patch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "WebKurierCore", unifiedDiff: lastPatch.unifiedDiff })
  });

  const data = await resp.json();
  addMsg("system", data.ok ? "✅ Применено (через WDA)" : `❌ ${data.error || "ошибка"}`);
}

// ✅ добавь в самый конец файла (чтобы кнопка из programmer-agent.js работала)
window.__WK_PROGRAMMER_APPLY_PATCH__ = applyPatch;