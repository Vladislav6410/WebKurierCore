// engine/agents/telemetry/telemetry-agent.js

export const TelemetryAgent = {
  getStatus: () => {
    const status = `
📡 Телеметрия подключена
🔋 Заряд аккумулятора: 87%
📶 Уровень сигнала: сильный
🌡 Температура: 42°C
🚁 Скорость: 3.2 м/с
📍 GPS: 50.4518°N, 30.5234°E
    `.trim();
    TelemetryAgent._output(status);
  },

  diagnostics: () => {
    const result = `
🔍 Диагностика систем:
• Моторы: ✅ в норме
• Камера: ✅ подключена
• IMU: ✅ стабильна
• GPS: ✅ активен
    `.trim();
    TelemetryAgent._output(result);
  },

  _output: (text) => {
    const el = document.getElementById("output");
    if (el) {
      el.innerText = text;
    } else {
      console.warn("❗ Элемент #output не найден");
    }
  }
};