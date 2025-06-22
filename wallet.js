// Простой WebCoin-кошелёк (локальное хранилище)
const WALLET_KEY = 'webcoin_balance';

function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY)) || 0;
}

function setBalance(value) {
  localStorage.setItem(WALLET_KEY, value);
}

function addCoins(amount) {
  const current = getBalance();
  setBalance(current + amount);
}

function displayBalance() {
  const balanceElement = document.getElementById('balance');
  if (balanceElement) {
    balanceElement.textContent = `Ваш баланс: ${getBalance()} WKC`;
  }
}

// Автообновление при загрузке
document.addEventListener('DOMContentLoaded', displayBalance);