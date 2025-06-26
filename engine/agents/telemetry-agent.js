// telemetry-agent.js
console.log("📡 Telemetry Agent загружен");

export const TelemetryAgent = {
  name: "Telemetry",
  description: "Собирает ID, координаты, высоту и другие параметры ближайших объектов.",
  version: "1.0.0",

  detectedObjects: [
    { id: "ALLY-17", distance: 320, altitude: 110 },
    { id: "UNKNOWN-UAV", distance: 150, altitude: 95 }
  ],

  getDetectedIDs: function () {
    return this.detectedObjects.map(obj => obj.id);
  },

  getFullData: function () {
    return this.detectedObjects;
  },

  commands: {
    "/nearby": () => {
      const list = TelemetryAgent.detectedObjects.map(
        obj => `• ${obj.id} — ${obj.distance}м, высота: ${obj.altitude}м`
      ).join("\n");
      return `📍 Объекты поблизости:\n${list}`;
    },

    "/help": () =>
      "📡 Команды Telemetry:\n" +
      "• /nearby — показать объекты\n" +
      "• /help — помощь"
  },

  handleCommand: function (cmd) {
    const base = cmd.trim().split(" ")[0];
    const fn = this.commands[base];
    return fn ? fn() : "❓ Команда не найдена. Введи /help";
  }
};