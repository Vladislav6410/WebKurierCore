// wallet.js

const WALLET_KEY = "webcoin_balance";

// Получение текущего баланса
function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0");
}

// Установка баланса
function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  updateBalanceUI();
}

// Добавить монеты
function addCoins(amount) {
  const current = getBalance();
  setBalance(current + amount);
}

// Сброс баланса
function resetWallet() {
  setBalance(0);
}

// Обновление UI-элемента баланса (если есть)
function updateBalanceUI() {
  const el = document.getElementById("wallet-balance");
  if (el) {
    el.textContent = getBalance() + " WebCoin";
  }
}

// Обработка команд из терминала
function handleWalletCommand(command) {
  switch (command.trim()) {
    case "/add":
      addCoins(10);
      return "Добавлено 10 WebCoin.";
    case "/reset":
      resetWallet();
      return "Баланс сброшен.";
    case "/balance":
      return "Текущий баланс: " + getBalance() + " WebCoin.";
    default:
      return null;
  }
}

// Кнопки (если подключены через HTML)
document.addEventListener("DOMContentLoaded", () => {
  updateBalanceUI();

  const addBtn = document.getElementById("add-coins");
  if (addBtn) addBtn.onclick = () => addCoins(10);

  const resetBtn = document.getElementById("reset-wallet");
  if (resetBtn) resetBtn.onclick = resetWallet;
});