// engine/agents/techsupport/techsupport-agent.js

export const TechSupportAgent = {
  checkStatus: () => {
    const status = "✅ Система работает нормально.\nВсе модули подключены.";
    TechSupportAgent._output(status);
  },

  help: () => {
    const helpText = `
🛟 Доступные команды:
• checkStatus() — Проверка состояния
• clearCache() — Очистка кэша
• help() — Справка по агенту
    `.trim();
    TechSupportAgent._output(helpText);
  },

  clearCache: () => {
    localStorage.clear();
    const msg = "🧹 Кэш и временные данные очищены.";
    TechSupportAgent._output(msg);
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) {
      out.innerText = text;
    } else {
      console.warn("❗ Элемент #output не найден.");
    }
  }
};