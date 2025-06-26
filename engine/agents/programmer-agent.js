// programmer-agent.js
console.log("💻 Programmer Agent загружен");

export const ProgrammerAgent = {
  name: "Programmer",
  description: "Генерирует, анализирует и исправляет код. Работает с JS, Python, HTML и др.",
  version: "1.0.0",

  examples: {
    js: `function hello(name) {\n  return "Привет, " + name + "!";\n}`,
    html: `<button onclick="alert('Привет!')">Нажми</button>`,
    python: `def greet(name):\n  return f"Привет, {name}"`
  },

  commands: {
    "/code js": () => ProgrammerAgent.examples.js,
    "/code html": () => ProgrammerAgent.examples.html,
    "/code py": () => ProgrammerAgent.examples.python,

    "/explain": () =>
      "🧠 Этот агент может:\n" +
      "• Генерировать шаблоны кода (JS, Python, HTML)\n" +
      "• Пояснять команды\n" +
      "• Предлагать улучшения\n" +
      "• Давать рекомендации по архитектуре",

    "/help": () =>
      "💻 Команды программиста:\n" +
      "• /code js — пример JavaScript\n" +
      "• /code html — пример HTML-кнопки\n" +
      "• /code py — пример Python\n" +
      "• /explain — описание возможностей\n" +
      "• /help — справка"
  },

  handleCommand(cmd) {
    const base = cmd.trim().toLowerCase();
    const fn = this.commands[base];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};