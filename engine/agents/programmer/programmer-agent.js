// engine/agents/programmer/programmer-agent.js
// Универсальный ProgrammerAgent: поддерживает простой UI (#output)
// и VibeCoding UI (chat addMsg + lastPatch + applyPatch через WDA)

function uiPrint(text) {
  // 1) новый UI-хук (если есть)
  if (typeof window.__WK_PROGRAMMER_PRINT__ === "function") {
    window.__WK_PROGRAMMER_PRINT__(text);
    return;
  }

  // 2) старый #output
  const out = document.getElementById("output");
  if (out) {
    out.innerText = text;
    return;
  }

  // 3) fallback
  console.log("[ProgrammerAgent]", text);
}

export const ProgrammerAgent = {
  generateCode: (prompt = "") => {
    const code = `
<!-- Пример сгенерированного HTML-кода -->
<div class="card">
  <h2>Заголовок</h2>
  <p>Описание блока, сгенерированного агентом.</p>
</div>
    `.trim();

    uiPrint("🧠 GenerateCode\n" + (prompt ? `Промпт: ${prompt}\n\n` : "") + code);
  },

  fixBugs: (prompt = "") => {
    const message =
      "🛠 Проверка завершена: ошибок не обнаружено (симуляция)\n" +
      (prompt ? `\nПромпт: ${prompt}` : "");
    uiPrint(message);
  },

  // ✅ Кнопка Apply через WDA:
  // Реальный apply делает backend (/api/programmer/apply_patch),
  // а unifiedDiff хранится в UI как lastPatch.unifiedDiff.
  applyPatchWDA: async () => {
    // Вариант 1 (лучший): новый UI сам экспортирует функцию applyPatch()
    // window.__WK_PROGRAMMER_APPLY_PATCH__ = applyPatch
    if (typeof window.__WK_PROGRAMMER_APPLY_PATCH__ === "function") {
      uiPrint("⏳ Применяю патч через WDA...");
      try {
        await window.__WK_PROGRAMMER_APPLY_PATCH__();
        uiPrint("✅ Запрос apply отправлен (через UI → WDA).");
      } catch (e) {
        uiPrint(`❌ Ошибка apply: ${String(e?.message || e)}`);
      }
      return;
    }

    // Вариант 2: если UI хранит diff в window.__WK_PROGRAMMER_LAST_DIFF__
    // (можно добавить позже)
    if (typeof window.__WK_PROGRAMMER_LAST_DIFF__ === "string" && window.__WK_PROGRAMMER_LAST_DIFF__) {
      uiPrint("⏳ Применяю патч через WDA (fallback diff-string)...");
      try {
        const resp = await fetch("/api/programmer/apply_patch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: "WebKurierCore",
            unifiedDiff: window.__WK_PROGRAMMER_LAST_DIFF__
          })
        });
        const data = await resp.json().catch(() => ({}));
        uiPrint(data.ok ? "✅ Применено (через WDA)" : `❌ ${data.error || "ошибка"}`);
      } catch (e) {
        uiPrint(`❌ Ошибка apply: ${String(e?.message || e)}`);
      }
      return;
    }

    uiPrint(
      "❌ Не найден UI hook для apply.\n" +
      "Нужно добавить в programmer-ui.js строку:\n" +
      "  window.__WK_PROGRAMMER_APPLY_PATCH__ = applyPatch;\n" +
      "И убедиться что lastPatch.unifiedDiff существует."
    );
  },

  _output: uiPrint
};

// Чтобы работало с onclick в HTML:
window.ProgrammerAgent = ProgrammerAgent;

