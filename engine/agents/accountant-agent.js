// accountant-agent.js
console.log("💰 Accountant Agent загружен");

export const AccountantAgent = {
  name: "Accountant",
  description: "Ведёт финансы проекта: расходы, доходы, отчёты, окупаемость.",
  version: "1.0.0",

  finances: {
    income: 0,
    expenses: 0
  },

  commands: {
    "/balance": () => {
      const { income, expenses } = AccountantAgent.finances;
      const profit = income - expenses;
      return `📊 Баланс:\nДоход: ${income} €\nРасходы: ${expenses} €\nИтого: ${profit} €`;
    },

    "/addincome": (amount) => {
      const value = parseFloat(amount);
      if (isNaN(value)) return "❗ Укажи сумму: /addincome 1000";
      AccountantAgent.finances.income += value;
      return `✅ Добавлено в доход: ${value} €`;
    },

    "/addexpense": (amount) => {
      const value = parseFloat(amount);
      if (isNaN(value)) return "❗ Укажи сумму: /addexpense 500";
      AccountantAgent.finances.expenses += value;
      return `✅ Добавлено в расходы: ${value} €`;
    },

    "/resetfinance": () => {
      AccountantAgent.finances = { income: 0, expenses: 0 };
      return "🔄 Финансы сброшены.";
    },

    "/help": () =>
      "💰 Команды:\n" +
      "• /balance — текущий баланс\n" +
      "• /addincome [сумма] — добавить доход\n" +
      "• /addexpense [сумма] — добавить расход\n" +
      "• /resetfinance — сбросить финансы\n" +
      "• /help — помощь"
  },

  handleCommand: function (input) {
    const [base, ...args] = input.trim().split(" ");
    const fn = this.commands[base];
    return fn ? fn(...args) : "❓ Неизвестная команда. Введи /help";
  }
};