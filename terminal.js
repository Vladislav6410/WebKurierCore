import * as MasterAgent from "./engine/agents/master-agent.js";

const WALLET_KEY = "webcoin_balance";

// Базовые операции
function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10);
}

function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  localStorage.setItem("wallet_updated", new Date().toISOString());
  if (!localStorage.getItem("wallet_created")) {
    localStorage.setItem("wallet_created", new Date().toISOString());
  }
  updateBalanceUI();
}

function addCoins(amount) {
  const current = getBalance();
  setBalance(current + amount);
}

function resetWallet() {
  setBalance(0);
}

// Интерфейс
function updateBalanceUI() {
  const el = document.getElementById("wallet-balance");
  if (el) {
    el.textContent = "💰 Баланс: " + getBalance() + " WebCoin";
  }
}

function printToTerminal(message, isError = false) {
  const output = document.getElementById("terminal-output");
  if (!output) return;

  const line = document.createElement("div");
  line.textContent = message;
  line.style.color = isError ? "red" : "white";
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

// Расширенные команды
const walletCommands = {
  "/add": {
    description: "/add [число] — добавить монеты",
    exec: (args) => {
      const amount = parseInt(args[0] || "10", 10);
      if (isNaN(amount) || amount <= 0) throw "Введите положительное число.";
      addCoins(amount);
      return `✅ Добавлено ${amount} WebCoin.`;
    }
  },
  "/reset": {
    description: "/reset — сбросить баланс",
    exec: () => {
      resetWallet();
      return "🔁 Баланс сброшен.";
    }
  },
  "/balance": {
    description: "/balance — показать баланс",
    exec: () => `💰 Баланс: ${getBalance()} WebCoin.`
  },
  "/set": {
    description: "/set [число] — установить баланс",
    exec: (args) => {
      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount < 0) throw "Введите корректное число.";
      setBalance(amount);
      return `🔧 Установлен баланс: ${amount} WebCoin.`;
    }
  },
  "/help": {
    description: "/help — список команд",
    exec: () => Object.values(walletCommands).map(c => "📌 " + c.description).join("\n")
  },
  "/stats": {
    description: "/stats — статистика кошелька",
    exec: () => {
      const created = new Date(localStorage.getItem("wallet_created") || Date.now()).toLocaleString();
      const updated = new Date(localStorage.getItem("wallet_updated") || Date.now()).toLocaleString();
      return `📊 Статистика:\n🪙 Баланс: ${getBalance()} WebCoin\n📅 Создан: ${created}\n🕓 Обновлён: ${updated}`;
    }
  },
  "/export": {
    description: "/export — сохранить баланс в файл",
    exec: () => {
      const data = JSON.stringify({ 
        balance: getBalance(),
        created: localStorage.getItem("wallet_created"),
        updated: localStorage.getItem("wallet_updated")
      });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "webcoin_wallet.json";
      a.click();
      return "💾 Баланс сохранён в файл.";
    }
  },
  "/import": {
    description: "/import — загрузить файл кошелька",
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
              if (data.created) localStorage.setItem("wallet_created", data.created);
              if (data.updated) localStorage.setItem("wallet_updated", data.updated);
              printToTerminal("📥 Баланс загружен: " + data.balance + " WebCoin.");
            } else {
              throw "Неверный формат файла.";
            }
          } catch (e) {
            printToTerminal("⚠️ Ошибка импорта: " + e, true);
          }
        };
        reader.readAsText(file);
      };
      input.click();
      return "📂 Выберите файл кошелька.";
    }
  },
  "/tip": {
    description: "/tip [агент] [сумма] — отправить агенту WebCoin",
    exec: async ([agent, amount]) => {
      const value = parseInt(amount, 10);
      if (!agent || isNaN(value) || value <= 0) throw "Укажи агента и сумму.";
      if (getBalance() < value) throw "Недостаточно средств.";
      
      // Интеграция с MasterAgent
      const result = await MasterAgent.sendCoins(agent, value);
      if (!result.success) throw `Ошибка отправки: ${result.error || "неизвестная ошибка"}`;
      
      setBalance(getBalance() - value);
      return `📤 ${value} WebCoin отправлено агенту ${agent}`;
    }
  },
  "/history": {
    description: "/history — история операций",
    exec: () => {
      const history = JSON.parse(localStorage.getItem("wallet_history") || "[]");
      if (history.length === 0) return "📜 История операций пуста";
      
      return history.map((entry, i) => 
        `${i+1}. ${entry.date}: ${entry.type} ${entry.amount} WC → ${entry.balance} WC`
      ).join("\n");
    }
  },
  "/sync": {
    description: "/sync — синхронизировать с сервером",
    exec: async () => {
      try {
        const res = await fetch("/api/sync-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            balance: getBalance(),
            created: localStorage.getItem("wallet_created"),
            updated: localStorage.getItem("wallet_updated")
          })
        });
        const json = await res.json();
        return "🌐 Баланс синхронизирован: " + (json.status || "успешно");
      } catch (e) {
        return "⚠️ Ошибка синхронизации: " + e;
      }
    }
  },
  "/agents": {
    description: "/agents — список активных агентов",
    exec: async () => {
      try {
        const agents = await MasterAgent.listActiveAgents();
        return "🤖 Активные агенты:\n" + agents.map(a => `- ${a.name} (v${a.version})`).join("\n");
      } catch (e) {
        return "⚠️ Ошибка получения списка агентов: " + e;
      }
    }
  },
  "/market": {
    description: "/market — показать рыночные курсы",
    exec: async () => {
      try {
        const rates = await MasterAgent.getExchangeRates();
        return `📈 Рыночные курсы:\n${Object.entries(rates)
          .map(([currency, rate]) => `- 1 WebCoin = ${rate} ${currency}`)
          .join("\n")}`;
      } catch (e) {
        return "⚠️ Ошибка получения курсов: " + e;
      }
    }
  }
};

// Журналирование операций
function logTransaction(type, amount) {
  const history = JSON.parse(localStorage.getItem("wallet_history") || "[]");
  history.push({
    date: new Date().toLocaleString(),
    type,
    amount,
    balance: getBalance()
  });
  localStorage.setItem("wallet_history", JSON.stringify(history.slice(-50)));
}

// Модифицируем функции для журналирования
const originalAddCoins = addCoins;
addCoins = (amount) => {
  originalAddCoins(amount);
  logTransaction("DEPOSIT", amount);
};

const originalSetBalance = setBalance;
setBalance = (amount) => {
  const diff = amount - getBalance();
  originalSetBalance(amount);
  if (diff !== 0) {
    logTransaction(diff > 0 ? "DEPOSIT" : "WITHDRAW", Math.abs(diff));
  }
};

// Обработка команды
async function handleWalletCommand(command) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  const commandEntry = walletCommands[cmd];
  if (!commandEntry) return "❌ Неизвестная команда. Введите /help.";
  try {
    return await commandEntry.exec(args);
  } catch (err) {
    return `⚠️ ${err}`;
  }
}

// История команд
let commandHistory = [];
let historyIndex = -1;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  // Создаем историю при первом запуске
  if (!localStorage.getItem("wallet_created")) {
    localStorage.setItem("wallet_created", new Date().toISOString());
  }
  
  updateBalanceUI();

  const addBtn = document.getElementById("add-coins");
  const resetBtn = document.getElementById("reset-wallet");
  const executeBtn = document.getElementById("execute-command");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");

  async function runCommand() {
    const cmd = input.value.trim();
    if (!cmd) return;

    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    commandHistory = commandHistory.slice(0, 10);
    historyIndex = -1;

    // Интеграция с DreamMaker
    let response;
    if (window.lastMedia) {
      const img = window.lastMedia.image;
      const vid = window.lastMedia.video;
      const aud = window.lastMedia.audio;

      if (vid) response = dreammaker.fromVideo(vid);
      else if (img && aud) response = dreammaker.animate(img, aud);
      else if (aud && !img) response = 'Укажите фото или видео вместе со звуком.';
      else response = await handleWalletCommand(cmd);

      window.lastMedia = {};
    } else {
      response = await handleWalletCommand(cmd);
      if (!response && cmd) response = dreammaker.voiceOver(cmd);
    }

    printToTerminal(response, response.startsWith("⚠️") || response.startsWith("❌"));
    updateBalanceUI();
    input.value = "";
  }

  if (addBtn) addBtn.onclick = () => {
    addCoins(10);
    updateBalanceUI();
  };

  if (resetBtn) resetBtn.onclick = () => {
    resetWallet();
    updateBalanceUI();
  };

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
