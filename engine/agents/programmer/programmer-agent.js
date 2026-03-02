// engine/agents/programmer/programmer-agent.js

export const ProgrammerAgent = {
  generateCode: () => {
    const code = `
<!-- Пример сгенерированного HTML-кода -->
<div class="card">
  <h2>Заголовок</h2>
  <p>Описание блока, сгенерированного агентом.</p>
</div>
    `.trim();

    ProgrammerAgent._output(code);
  },

  fixBugs: () => {
    const message = "🛠 Проверка завершена: ошибок не обнаружено (симуляция)";
    ProgrammerAgent._output(message);
  },

  // ✅ новая кнопка: Apply через WDA (реальный apply делает backend)
  applyPatchWDA: async () => {
    // UI (programmer-ui.js) должен отдать lastPatch.unifiedDiff
    // поэтому вызываем хук, который живёт в UI
    if (typeof window.__WK_PROGRAMMER_APPLY_PATCH__ !== "function") {
      ProgrammerAgent._output("❌ UI hook __WK_PROGRAMMER_APPLY_PATCH__ не найден. Проверь programmer-ui.js (в конце файла должен быть window.__WK_PROGRAMMER_APPLY_PATCH__ = applyPatch).");
      return;
    }

    ProgrammerAgent._output("⏳ Применяю патч через WDA...");
    try {
      await window.__WK_PROGRAMMER_APPLY_PATCH__();
    } catch (e) {
      ProgrammerAgent._output(`❌ Ошибка apply: ${String(e?.message || e)}`);
    }
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) {
      out.innerText = text;
    } else {
      console.warn("Элемент #output не найден.");
    }
  }
};

// чтобы работало с onclick в html:
window.ProgrammerAgent = ProgrammerAgent;

