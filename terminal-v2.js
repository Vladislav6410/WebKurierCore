// === terminal-v2.js — Обновлённый терминал с UI, кнопками и историей ===

import * as MasterAgent from "./engine/agents/master-agent.js";

// Баланс
const WALLET_KEY = "webcoin_balance";

function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10);
}

function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  updateBalanceUI();
}

function updateBalanceUI() {
  const el = document.getElementById("wallet-balance");
  if (el) el.textContent = `💰 Баланс: ${getBalance()} WebCoin`;
}

// Вывод в терминал
function printToTerminal(message, isError = false) {
  const log = document.getElementById("terminal-log");
  const line = document.createElement("div");
  line.textContent = message;
  line.className = isError ? "error" : "log";
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

// Команды
const commands = {
  "/help": {
    description: "📘 Список команд",
    exec: () => Object.entries(commands).map(([cmd, obj]) => `${cmd} — ${obj.description}`).join("\n")
  },
  "/add": {
    description: "Добавить 10 WebCoin",
    exec: () => {
      const value = getBalance() + 10;
      setBalance(value);
      return `✅ Добавлено 10 WebCoin. Новый баланс: ${value}`;
    }
  },
  "/reset": {
    description: "Сбросить баланс",
    exec: () => {
      setBalance(0);
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
          .map(([cur, rate]) => `1 WebCoin = ${rate} ${cur}`).join("\n");
      } catch (e) {
        return "⚠️ Ошибка получения курсов.";
      }
    }
  }
};

// Обработка команд
async function handleCommand(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("terminal-input");
    const cmd = input.value.trim();
    input.value = "";

    if (!cmd) return;

    printToTerminal("> " + cmd);

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
  }
}

// Кнопка Enter (вручную)
function runCommandButton() {
  const input = document.getElementById("terminal-input");
  const fakeEvent = { key: "Enter" };
  handleCommand(fakeEvent);
}

// Кнопка Копировать
function copyLastCommand() {
  const input = document.getElementById("terminal-input");
  navigator.clipboard.writeText(input.value || "").then(() => {
    printToTerminal("📋 Команда скопирована.");
  });
}

// Подключение
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("terminal-input");
  const enterBtn = document.getElementById("btn-enter");
  const copyBtn = document.getElementById("btn-copy");

  if (input) input.addEventListener("keydown", handleCommand);
  if (enterBtn) enterBtn.addEventListener("click", runCommandButton);
  if (copyBtn) copyBtn.addEventListener("click", copyLastCommand);

  updateBalanceUI();
});