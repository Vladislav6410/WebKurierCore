// === wallet.js — WebCoin Кошелёк ===

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

// Обновить интерфейс при загрузке страницы
window.addEventListener("DOMContentLoaded", updateBalanceUI);