// intelligence-agent.js
console.log("🧠 Intelligence Agent загружен");

export const IntelligenceAgent = {
  name: "Intelligence",
  description: "Управляет логикой агентов, обрабатывает запросы и формирует решения.",
  version: "1.0.0",

  state: {
    activeAgents: [],
    lastCommand: null,
    context: {},
  },

  commands: {
    "/status": () => {
      const count = IntelligenceAgent.state.activeAgents.length;
      return `🧠 Агент активен. Подключено агентов: ${count}`;
    },

    "/remember": () => {
      const ctx = JSON.stringify(IntelligenceAgent.state.context, null, 2);
      return ctx === "{}" ? "🗂 Контекст пуст." : `📌 Память:\n${ctx}`;
    },

    "/addctx": (key, value) => {
      if (!key || !value) return "❗ Укажи ключ и значение: /addctx ключ значение";
      IntelligenceAgent.state.context[key] = value;
      return `✅ Добавлено в память: ${key} = ${value}`;
    },

    "/plan": () => {
      return "📋 План: 1) Сканирование зоны. 2) Анализ. 3) Решение. 4) Выполнение.";
    },

    "/help": () =>
      "🧠 Команды:\n" +
      "• /status — состояние агента\n" +
      "• /remember — показать память\n" +
      "• /addctx ключ значение — добавить в контекст\n" +
      "• /plan — текущий план действий\n" +
      "• /help — справка"
  },

  handleCommand: function (input) {
    const parts = input.trim().split(" ");
    const base = parts[0];
    const args = parts.slice(1);
    const fn = this.commands[base];
    return fn ? fn(...args) : "❓ Неизвестная команда. Введи /help";
  },

  linkAgent: function (agentName) {
    if (!this.state.activeAgents.includes(agentName)) {
      this.state.activeAgents.push(agentName);
    }
  },

  resetContext: function () {
    this.state.context = {};
  }
};