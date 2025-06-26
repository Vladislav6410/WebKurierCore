// autopilot-agent.js
console.log("🛩️ Autopilot Agent загружен");

export const AutopilotAgent = {
  name: "Autopilot",
  description: "Управляет режимами полёта дрона: взлёт, зависание, маршрут, посадка.",
  version: "1.0.0",

  status: "standby",

  commands: {
    "/takeoff": () => {
      AutopilotAgent.status = "takeoff";
      return "🚀 Взлёт инициирован.";
    },

    "/hover": () => {
      AutopilotAgent.status = "hover";
      return "🌀 Режим зависания активирован.";
    },

    "/land": () => {
      AutopilotAgent.status = "landing";
      return "🛬 Посадка началась.";
    },

    "/status": () => {
      return `📊 Текущий режим автопилота: ${AutopilotAgent.status}`;
    },

    "/help": () =>
      "🛩 Команды автопилота:\n" +
      "• /takeoff — взлёт\n" +
      "• /hover — зависание\n" +
      "• /land — посадка\n" +
      "• /status — статус\n" +
      "• /help — помощь"
  },

  handleCommand: function (cmd) {
    const base = cmd.trim().split(" ")[0];
    const fn = this.commands[base];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};