// techsupport-agent.js
console.log("🛠 TechSupport Agent загружен");

export const TechSupportAgent = {
  name: "TechSupport",
  description: "Оказывает техническую помощь, диагностирует ошибки, предлагает решение.",
  version: "1.0.0",

  diagnostics: {
    internet: true,
    battery: 89,
    agentsLoaded: ["Core", "Drone", "Voice"]
  },

  commands: {
    "/status": () => {
      const status = TechSupportAgent.diagnostics;
      return `📋 Статус системы:\n` +
             `• Интернет: ${status.internet ? "🟢" : "🔴"}\n` +
             `• Батарея: ${status.battery}%\n` +
             `• Активные агенты:\n  - ` + status.agentsLoaded.join("\n  - ");
    },

    "/suggest": () =>
      "💡 Советы:\n" +
      "• Проверь соединение с интернетом\n" +
      "• Перезагрузи модуль агента (/reload)\n" +
      "• Очисти кэш браузера\n" +
      "• Используй последнюю версию WebKurier",

    "/reload": () => {
      location.reload();
      return "🔁 Перезагрузка страницы…";
    },

    "/help": () =>
      "🛠 Команды техподдержки:\n" +
      "• /status — системная информация\n" +
      "• /suggest — советы по устранению проблем\n" +
      "• /reload — перезагрузить интерфейс\n" +
      "• /help — справка"
  },

  handleCommand(cmd) {
    const base = cmd.trim().split(" ")[0];
    const fn = this.commands[base];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};