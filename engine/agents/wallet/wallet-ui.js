// === wallet-ui.js — UI для WebCoin Wallet ===
import { handleWalletCommand } from "./wallet-agent.js";
import config from "./wallet-config.json" assert { type: "json" };

// === ① Создание кнопок из config.ui.buttons ===
function createWalletUI() {
  const container = document.getElementById("wallet-ui");
  if (!container || !config.ui?.buttons) return;

  container.innerHTML = ""; // Очистить старые кнопки

  config.ui.buttons.forEach(label => {
    const btn = document.createElement("button");
    btn.textContent = label;

    btn.onclick = () => {
      switch (label) {
        case "+10":
          handleWalletCommand("/add 10", print);
          break;
        case "Сброс":
          handleWalletCommand("/reset", print);
          break;
        case "Экспорт":
          handleWalletCommand("/export", print);
          break;
        case "Импорт":
          handleWalletCommand("/import", print);
          break;
        default:
          print("⚠️ Неизвестная кнопка");
      }
    };

    container.appendChild(btn);
  });
}

// === ② Автоматическое восстановление из backup при загрузке ===
function restoreFromBackup() {
  if (!config.backup?.enabled) return;

  const saved = localStorage.getItem(config.backup.fileName || "wallet-backup.json");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (typeof data.balance === "number") {
        localStorage.setItem("webcoin_balance", data.balance);
      }
    } catch (e) {
      console.warn("❌ Ошибка восстановления баланса из backup:", e);
    }
  }
}

// === ③ Вывод сообщений (эмуляция терминала)
function print(msg) {
  const log = document.getElementById("terminal-log");
  if (log) {
    log.innerHTML += msg + "<br>";
    log.scrollTop = log.scrollHeight;
  } else {
    alert(msg);
  }
}

// === ④ Инициализация после загрузки страницы ===
window.addEventListener("DOMContentLoaded", () => {
  restoreFromBackup();
  createWalletUI();
});