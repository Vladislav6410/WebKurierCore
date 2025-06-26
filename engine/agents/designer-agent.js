// designer-agent.js
console.log("🎨 Designer Agent загружен");

export const DesignerAgent = {
  name: "Designer",
  description: "Отвечает за стили, интерфейс, UI/UX, оформление страниц.",
  version: "1.0.0",

  commands: {
    "/suggest-theme": () => {
      return "🎨 Рекомендую использовать тёмную тему с акцентами #66ccff и шрифтами типа Inter или Roboto.";
    },

    "/button-style": () => {
      return `📦 Стиль кнопки:\n` +
        `background-color: #007bff;\n` +
        `color: #fff;\n` +
        `border: none;\n` +
        `border-radius: 6px;\n` +
        `padding: 10px 20px;\n` +
        `font-weight: bold;`;
    },

    "/panel-style": () => {
      return `🧱 Стиль панели:\n` +
        `background: linear-gradient(to right, #1e3c72, #2a5298);\n` +
        `color: white;\n` +
        `padding: 20px;\n` +
        `border-radius: 8px;\n` +
        `box-shadow: 0 4px 10px rgba(0,0,0,0.2);`;
    },

    "/help": () => {
      return "🎨 Команды дизайнера:\n" +
        "• /suggest-theme — предложить тему оформления\n" +
        "• /button-style — стиль кнопки\n" +
        "• /panel-style — стиль панели\n" +
        "• /help — список команд";
    }
  },

  handleCommand: function (input) {
    const [base] = input.trim().split(" ");
    const fn = this.commands[base];
    return fn ? fn() : "❓ Неизвестная команда. Введи /help";
  }
};