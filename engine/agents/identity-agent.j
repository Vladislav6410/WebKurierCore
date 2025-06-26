// identity-agent.js
console.log("🛰 Identity Agent загружен");

export const IdentityAgent = {
  name: "Identity",
  description: "Распознаёт воздушные объекты: определяет 'свой/чужой' по сигнатурам и ID.",
  version: "1.0.0",

  knownIDs: ["KURIER-X", "ALLY-17", "DRONE-42"],

  commands: {
    "/scan": () => {
      const detected = ["ALLY-17", "UFO-51"];
      const result = detected.map(id =>
        IdentityAgent.knownIDs.includes(id)
          ? `✅ ${id} — СВОЙ`
          : `⚠️ ${id} — НЕИЗВЕСТНЫЙ`
      ).join("\n");
      return `📡 Результат сканирования:\n${result}`;
    },

    "/addid": () => {
      IdentityAgent.knownIDs.push("NEW-DRONE-99");
      return "➕ Добавлен ID: NEW-DRONE-99";
    },

    "/list": () => {
      return "📋 Список 'своих':\n• " + IdentityAgent.knownIDs.join("\n• ");
    },

    "/help": () =>
      "🛰 Команды агента:\n" +
      "• /scan — сканировать окрестность\n" +
      "• /addid — добавить ID\n" +
      "• /list — список 'своих'\n" +
      "• /help — помощь"
  },

  handleCommand: function (cmd) {
    const base = cmd.trim().split(" ")[0];
    const fn = this.commands[base];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};