// === WebCoin Wallet Script ===

const WALLET_KEY = "webcoin";

// Получение текущего баланса
function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10);
}

// Установка нового баланса
function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  updateBalanceUI();
}

// Добавление монет
function addCoins(amount) {
  const current = getBalance();
  setBalance(current + amount);
}

// Сброс баланса
function resetCoins() {
  setBalance(0);
}

// Обновление баланса на странице
function updateBalanceUI() {
  const el = document.getElementById("webcoin-balance");
  if (el) {
    el.textContent = `Баланс: ${getBalance()} WKC`;
  }
}

// Инициализация интерфейса
function initWallet() {
  const balanceEl = document.getElementById("webcoin-balance");
  const addBtn = document.querySelector("button[onclick*='addCoins']");
  const resetBtn = document.querySelector("button[onclick*='resetCoins']");

  if (balanceEl) updateBalanceUI();
  if (addBtn) addBtn.addEventListener("click", () => addCoins(10));
  if (resetBtn) resetBtn.addEventListener("click", resetCoins);
}

// Автоинициализация после загрузки
window.addEventListener("load", initWallet);