// drone-agent.js
console.log("🚁 Drone Agent загружен");

export const DroneAgent = {
  name: "Drone",
  description: "Управление дроном: запуск, посадка, статус, связь с навигатором и автопилотом.",
  version: "1.0.0",

  status: {
    battery: 87,
    gpsSignal: true,
    flying: false,
    altitude: 0
  },

  commands: {
    "/status": () => {
      const s = DroneAgent.status;
      return `📡 Статус дрона:\n` +
             `• Батарея: ${s.battery}%\n` +
             `• GPS: ${s.gpsSignal ? "📍 есть сигнал" : "❌ нет сигнала"}\n` +
             `• Полёт: ${s.flying ? "🛫 в воздухе" : "🛬 на земле"}\n` +
             `• Высота: ${s.altitude} м`;
    },

    "/takeoff": () => {
      if (DroneAgent.status.flying) return "⚠️ Уже в полёте.";
      DroneAgent.status.flying = true;
      DroneAgent.status.altitude = 5;
      return "🛫 Взлёт выполнен. Высота: 5 м.";
    },

    "/land": () => {
      if (!DroneAgent.status.flying) return "🛬 Уже на земле.";
      DroneAgent.status.flying = false;
      DroneAgent.status.altitude = 0;
      return "🛬 Посадка завершена.";
    },

    "/battery": () => {
      return `🔋 Заряд батареи: ${DroneAgent.status.battery}%`;
    },

    "/help": () =>
      "🚁 Команды дрона:\n" +
      "• /status — статус дрона\n" +
      "• /takeoff — взлёт\n" +
      "• /land — посадка\n" +
      "• /battery — уровень заряда\n" +
      "• /help — помощь"
  },

  handleCommand: function (input) {
    const [cmd] = input.trim().split(" ");
    const fn = this.commands[cmd];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};