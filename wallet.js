// === wallet.js — WebCoin Кошелёк Расширенный + Память Dropbox ===

const WALLET_KEY = "webcoin_balance";

// Получить текущий баланс
function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0");
}

// Установить баланс и обновить интерфейс
function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  updateBalanceUI();
}

// Добавить монеты
function addCoins(amount) {
  const current = getBalance();
  setBalance(current + amount);
}

// Сбросить баланс
function resetCoins() {
  setBalance(0);
}

// Обновить все элементы, отображающие баланс
function updateBalanceUI() {
  const amount = getBalance();
  const elements = [
    document.getElementById("balance"),
    document.getElementById("webcoin-balance"),
    document.getElementById("balance-display")
  ];

  elements.forEach(el => {
    if (el) {
      if (el.id === "balance") {
        el.textContent = amount;
      } else {
        el.textContent = `Баланс: ${amount} WKC`;
      }
    }
  });
}

// === КОМАНДЫ WALLET ===
const walletCommands = {
  "/add": {
    description: "/add [число] — добавить монеты",
    exec: (args) => {
      const amount = parseInt(args[0] || "10", 10);
      if (isNaN(amount) || amount <= 0) throw "Введите положительное число.";
      addCoins(amount);
      return `✅ Добавлено ${amount} WKC.`;
    }
  },
  "/reset": {
    description: "/reset — сбросить баланс",
    exec: () => {
      resetCoins();
      return "🔁 Баланс сброшен.";
    }
  },
  "/balance": {
    description: "/balance — показать баланс",
    exec: () => `💰 Баланс: ${getBalance()} WKC.`
  },
  "/set": {
    description: "/set [число] — установить баланс",
    exec: (args) => {
      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount < 0) throw "Введите корректное число.";
      setBalance(amount);
      return `🔧 Баланс установлен: ${amount} WKC.`;
    }
  },
  "/export": {
    description: "/export — сохранить баланс в файл",
    exec: () => {
      const data = JSON.stringify({ balance: getBalance() });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wallet.json";
      a.click();
      return "💾 Баланс сохранён.";
    }
  },
  "/import": {
    description: "/import — загрузить баланс из файла",
    exec: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (typeof data.balance === "number") {
              setBalance(data.balance);
              printToTerminal(`📥 Баланс загружен: ${data.balance} WKC`);
            } else {
              throw "Неверный формат.";
            }
          } catch (e) {
            printToTerminal(`⚠️ Ошибка: ${e}`, true);
          }
        };
        reader.readAsText(file);
      };
      input.click();
      return "📂 Выберите файл.";
    }
  }
};

// === КОМАНДЫ ENGINEER (Dropbox + память) ===
const engineerCommands = {
  "/help": {
    description: "/help — команды engineer.js",
    exec: () => handleEngineerCommand("/help")
  },
  "/add-note": {
    description: "/add-note [текст] — добавить заметку",
    exec: (args) => handleEngineerCommand("/add " + args.join(" "))
  },
  "/save": {
    description: "/save — сохранить память в Dropbox",
    exec: () => handleEngineerCommand("/save")
  },
  "/load": {
    description: "/load — загрузить память из Dropbox",
    exec: () => handleEngineerCommand("/load")
  },
  "/config": {
    description: "/config — загрузить конфиг",
    exec: () => handleEngineerCommand("/config")
  },
  "/clear": {
    description: "/clear — очистить память",
    exec: () => handleEngineerCommand("/clear")
  }
};

// === Объединение всех команд ===
const allCommands = {
  ...walletCommands,
  ...engineerCommands,
  "/help": {
    description: "/help — список всех команд",
    exec: () => {
      const list = Object.values(allCommands).map(c => "📌 " + c.description);
      return list.join("\n");
    }
  }
};

// === Обработчик ===
async function handleWalletCommand(command) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  const c = allCommands[cmd];
  if (!c) return "❌ Неизвестная команда. Используй /help.";
  try {
    const result = await c.exec(args);
    return result;
  } catch (e) {
    return `⚠️ ${e}`;
  }
}

// === Вывод в терминал ===
function printToTerminal(message, isError = false) {
  const output = document.getElementById("terminal-output");
  if (!output) return;
  const line = document.createElement("div");
  line.textContent = message;
  line.style.color = isError ? "red" : "lime";
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

// === История команд ===
let commandHistory = [];
let historyIndex = -1;

// === Запуск интерфейса ===
window.addEventListener("DOMContentLoaded", () => {
  updateBalanceUI();

  const input = document.getElementById("terminal-input");
  const executeBtn = document.getElementById("execute-command");

  async function runCommand() {
    const cmd = input.value.trim();
    if (!cmd) return;
    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    commandHistory = commandHistory.slice(0, 10);
    historyIndex = -1;
    const result = await handleWalletCommand(cmd);
    printToTerminal(result, result.startsWith("⚠️") || result.startsWith("❌"));
    updateBalanceUI();
    input.value = "";
  }

  if (executeBtn) executeBtn.onclick = runCommand;

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runCommand();
      else if (e.key === "ArrowUp") {
        if (commandHistory.length > 0) {
          historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          input.value = commandHistory[historyIndex];
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex];
        } else {
          historyIndex = -1;
          input.value = "";
        }
        e.preventDefault();
      }
    });
  }
});