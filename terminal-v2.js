// === terminal-merged.js — Объединённый терминал WebKurier ===

import * as MasterAgent from "./engine/agents/master-agent.js";

const WALLET_KEY = "webcoin_balance";

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

function printToTerminal(message, isError = false) {
  const output = document.getElementById("terminal-log");
  if (!output) return;

  const line = document.createElement("div");
  line.textContent = message;
  line.style.color = isError ? "red" : "white";
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

const commands = {
  "/help": {
    description: "📘 Список команд",
    exec: () =>
      Object.entries(commands)
        .map(([cmd, obj]) => `${cmd} — ${obj.description}`)
        .join("\n")
  },
  "/add": {
    description: "Добавить 10 WebCoin",
    exec: () => {
      addCoins(10);
      return `✅ Добавлено 10 WebCoin. Новый баланс: ${getBalance()}`;
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
  "/market": {
    description: "Показать курсы WebCoin",
    exec: async () => {
      try {
        const rates = await MasterAgent.getExchangeRates();
        return Object.entries(rates)
          .map(([cur, rate]) => `1 WebCoin = ${rate} ${cur}`)
          .join("\n");
      } catch (e) {
        return "⚠️ Ошибка получения курсов.";
      }
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
  }
};

// История команд
let commandHistory = [];
let historyIndex = -1;

async function handleCommand(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("terminal-input");
    const cmd = input.value.trim();
    input.value = "";
    if (!cmd) return;

    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    historyIndex = -1;

    const [command, ...args] = cmd.split(" ");
    const action = commands[command];

    if (!action) {
      printToTerminal("❌ Неизвестная команда. Введи /help", true);
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

function runCommandButton() {
  const input = document.getElementById("terminal-input");
  const fakeEvent = { key: "Enter" };
  handleCommand(fakeEvent);
}

function copyLastCommand() {
  const input = document.getElementById("terminal-input");
  navigator.clipboard.writeText(input.value || "").then(() => {
    printToTerminal("📋 Команда скопирована.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
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
        historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        input.value = commandHistory[historyIndex] || "";
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        historyIndex = Math.max(historyIndex - 1, -1);
        input.value = historyIndex >= 0 ? commandHistory[historyIndex] : "";
        e.preventDefault();
      }
    });
  }

  if (enterBtn) enterBtn.addEventListener("click", runCommandButton);
  if (copyBtn) copyBtn.addEventListener("click", copyLastCommand);
  if (addBtn) addBtn.addEventListener("click", () => {
    addCoins(10);
    updateBalanceUI();
  });
  if (resetBtn) resetBtn.addEventListener("click", () => {
    resetWallet();
    updateBalanceUI();
  });
});