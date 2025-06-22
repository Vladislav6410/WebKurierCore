const WALLET_KEY = "webcoin_balance";

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
function resetWallet() {
  setBalance(0);
}

// Обновление HTML-интерфейса (если элемент есть на странице)
function updateBalanceUI() {
  const el = document.getElementById("wallet-balance");
  if (el) {
    el.textContent = getBalance() + " WebCoin";
  }
}

// Обработка терминальных команд с аргументами
function handleWalletCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1];

  switch (cmd) {
    case "/add":
      const amount = parseInt(arg || "10", 10); // по умолчанию 10
      if (isNaN(amount) || amount <= 0) {
        return "Ошибка: введите положительное число для добавления.";
      }
      addCoins(amount);
      return `Добавлено ${amount} WebCoin.`;

    case "/reset":
      resetWallet();
      return "Баланс сброшен.";

    case "/balance":
      return "Текущий баланс: " + getBalance() + " WebCoin.";

    default:
      return "Неизвестная команда. Используйте: /add [n], /reset, /balance.";
  }
}

// Инициализация интерфейса
document.addEventListener("DOMContentLoaded", () => {
  updateBalanceUI();

  // Кнопки
  const addBtn = document.getElementById("add-coins");
  if (addBtn) addBtn.onclick = () => addCoins(10);

  const resetBtn = document.getElementById("reset-wallet");
  if (resetBtn) resetBtn.onclick = resetWallet;

  // Терминал
  const executeBtn = document.getElementById("execute-command");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");

  function runCommand() {
    const cmd = input.value.trim();
    if (!cmd) return;
    const result = handleWalletCommand(cmd);
    if (result && output) output.textContent = result;
    updateBalanceUI();
    input.value = "";
  }

  if (executeBtn) {
    executeBtn.onclick = runCommand;
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        runCommand();
      }
    });
  }
});