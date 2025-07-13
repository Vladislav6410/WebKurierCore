// engine/agents/pilot/pilot-agent.js

export const PilotAgent = {
  takeoff: () => {
    const msg = "🚁 Взлёт начат. Поднимаемся на высоту 5 метров.";
    PilotAgent._output(msg);
  },

  land: () => {
    const msg = "🛬 Посадка начата. Удерживаем позицию и снижаемся.";
    PilotAgent._output(msg);
  },

  holdPosition: () => {
    const msg = "⏸ Позиция зафиксирована. Дрон зависает на месте.";
    PilotAgent._output(msg);
  },

  followPath: () => {
    const msg = `
📍 Следуем по маршруту:
• Точка 1: 50.4518°N, 30.5234°E
• Точка 2: 50.4522°N, 30.5255°E
• Точка 3: 50.4530°N, 30.5271°E
🚁 Режим: Автоследование.
    `.trim();

    PilotAgent._output(msg);
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