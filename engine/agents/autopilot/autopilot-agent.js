// engine/agents/autopilot/autopilot-agent.js

export const AutoPilotAgent = {
  status: "🔄 Готов к запуску",

  startMission: () => {
    AutoPilotAgent._output("🚁 Автопилот: Запуск миссии...\n➤ Взлёт, набор высоты, следование маршруту...");
  },

  stopMission: () => {
    AutoPilotAgent._output("🛑 Автопилот: Остановка миссии и возврат в точку старта.");
  },

  holdPosition: () => {
    AutoPilotAgent._output("📍 Удержание позиции. Ждём команды...");
  },

  returnHome: () => {
    AutoPilotAgent._output("🏠 Возврат к точке запуска...");
  },

  getStatus: () => {
    AutoPilotAgent._output(`📡 Статус автопилота:\n${AutoPilotAgent.status}`);
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) out.innerText = text;
    console.log(text);
  }
};