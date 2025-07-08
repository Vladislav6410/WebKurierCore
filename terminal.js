// === terminal.js — Полный объединённый терминал WebKurier ===
import * as MasterAgent from "./engine/agents/master-agent.js";

const WALLET_KEY = "webcoin_balance";

// --- Базовые функции кошелька ---
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

function updateBalanceUI() {
  const el = document.getElementById("wallet-balance");
  if (el) el.textContent = `💰 Баланс: ${getBalance()} WebCoin`;
}

// --- Журналирование операций ---
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

// --- Модификация функций для журналирования ---
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

// --- Терминальный вывод ---
function printToTerminal(message, isError = false) {
  // Можно использовать "terminal-output" или "terminal-log" в зависимости от твоего HTML
  const output = document.getElementById("terminal-output") || document.getElementById("terminal-log");
  if (!output) return;

  const line = document.createElement("div");
  line.textContent = message;
  line.style.color = isError ? "red" : "white";
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

// --- Команды терминала ---
const commands = {
  "/help": {
    description: "📘 Список команд",
    exec: () =>
      Object.entries(commands)
        .map(([cmd, obj]) => `${cmd} — ${obj.description}`)
        .join("\n")
  },
  "/add": {
    description: "Добавить WebCoin: /add [число]",
    exec: ([amount]) => {
      const n = parseInt(amount || "10", 10);
      if (isNaN(n) || n <= 0) throw "Введите положительное число.";
      addCoins(n);
      return `✅ Добавлено ${n} WebCoin. Новый баланс: ${getBalance()}`;
    }
  },
  "/set": {
    description: "Установить баланс: /set [число]",
    exec: ([amount]) => {
      const n = parseInt(amount, 10);
      if (isNaN(n) || n < 0) throw "Введите корректное число.";
      setBalance(n);
      return `🔧 Баланс установлен: ${n} WebCoin.`;
    }
  },
  "/reset": {
    description: "Сбросить баланс",
    exec: () => {
      resetWallet();
      return "🔁 Баланс сброшен.";
    }
  },
  "/balance": {
    description: "Показать текущий баланс",
    exec: () => `💰 Баланс: ${getBalance()} WebCoin`
  },
  "/history": {
    description: "История операций",
    exec: () => {
      const history = JSON.parse(localStorage.getItem("wallet_history") || "[]");
      if (history.length === 0) return "📜 История операций пуста";
      return history.map((entry, i) =>
        `${i + 1}. ${entry.date}: ${entry.type} ${entry.amount} WC → ${entry.balance} WC`
      ).join("\n");
    }
  },
  "/import": {
    description: "Импортировать кошелёк из файла",
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
  "/export": {
    description: "Сохранить кошелёк в файл",
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
      return "💾 Баланс сохранён.";
    }
  },
  "/stats": {
    description: "Статистика кошелька",
    exec: () => {
      const created = new Date(localStorage.getItem("wallet_created") || Date.now()).toLocaleString();
      const updated = new Date(localStorage.getItem("wallet_updated") || Date.now()).toLocaleString();
      return `📊 Статистика:\n🪙 Баланс: ${getBalance()} WebCoin\n📅 Создан: ${created}\n🕓 Обновлён: ${updated}`;
    }
  },
  "/sync": {
    description: "Синхронизировать баланс с сервером",
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
  "/tip": {
    description: "Отправить агенту WebCoin: /tip [агент] [сумма]",
    exec: async ([agent, amount]) => {
      const value = parseInt(amount, 10);
      if (!agent || isNaN(value) || value <= 0) throw "Укажи агента и сумму.";
      if (getBalance() < value) throw "Недостаточно средств.";
      const result = await MasterAgent.sendCoins(agent, value);
      if (!result.success) throw `Ошибка отправки: ${result.error || "неизвестная ошибка"}`;
      setBalance(getBalance() - value);
      return `📤 ${value} WebCoin отправлено агенту ${agent}`;
    }
  },
  "/agents": {
    description: "Список активных агентов",
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
    description: "Показать рыночные курсы WebCoin",
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
  },
  "/status": {
    description: "Статус агента: /status [имя]",
    exec: ([agentName]) => {
      if (!agentName) throw "Укажите имя агента.";
      const status = MasterAgent.status && MasterAgent.status[agentName] || '❓ неизвестен';
      return `📍 Агент "${agentName}": ${status}`;
    }
  },
  "/reload": {
    description: "Перезагрузить агента: /reload [имя]",
    exec: ([agentName]) => {
      if (!agentName) throw "Укажите имя агента.";
      if (MasterAgent.agents && agentName in MasterAgent.agents) {
        MasterAgent.reload(agentName);
        return `🔁 Перезагрузка агента "${agentName}"...`;
      } else {
        throw `Агент "${agentName}" не найден.`;
      }
    }
  },
  "/clear": {
    description: "Очистить экран",
    exec: () => {
      const output = document.getElementById("terminal-output") || document.getElementById("terminal-log");
      if (output) output.innerHTML = "";
      return "";
    }
  },
  "/ping": {
    description: "Проверить соединение",
    exec: () => "🏓 Pong!"
  }
};

// --- История команд ---
let commandHistory = [];
let historyIndex = -1;

// --- Обработка команд ---
async function handleCommand(event) {
  if (event.key === "Enter" || event.type === "run") {
    const input = document.getElementById("terminal-input");
    const cmd = input.value.trim();
    input.value = "";
    if (!cmd) return;

    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    commandHistory = commandHistory.slice(0, 50);
    historyIndex = -1;

    const [command, ...args] = cmd.split(" ");
    const action = commands[command];

    if (!action) {
      printToTerminal("❌ Неизвестная команда. Введите /help", true);
      return;
    }

    try {
      const result = await action.exec(args);
      if (result) printToTerminal(result);
    } catch (err) {
      printToTerminal("⚠️ " + err, true);
    }

    updateBalanceUI();
  }
}

// --- Кнопки и инициализация ---
document.addEventListener("DOMContentLoaded", () => {
  // Создаем историю при первом запуске
  if (!localStorage.getItem("wallet_created")) {
    localStorage.setItem("wallet_created", new Date().toISOString());
  }
  updateBalanceUI();

  const input = document.getElementById("terminal-input");
  const enterBtn = document.getElementById("btn-enter");
  const copyBtn = document.getElementById("btn-copy");
  const addBtn = document.getElementById("add-coins");
  const resetBtn = document.getElementById("reset-wallet");

  if (input) {
    input.addEventListener("keydown", handleCommand);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        if (commandHistory.length > 0) {
          historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          input.value = commandHistory[historyIndex] || "";
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex] || "";
        } else {
          historyIndex = -1;
          input.value = "";
        }
        e.preventDefault();
      }
    });
  }

  if (enterBtn) enterBtn.addEventListener("click", () => handleCommand({ key: "Enter" }));
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (input) {
      navigator.clipboard.writeText(input.value || "").then(() => {
        printToTerminal("📋 Команда скопирована.");
      });
    }
  });
  if (addBtn) addBtn.addEventListener("click", () => {
    addCoins(10);
    updateBalanceUI();
  });
  if (resetBtn) resetBtn.addEventListener("click", () => {
    resetWallet();
    updateBalanceUI();
  });
});
