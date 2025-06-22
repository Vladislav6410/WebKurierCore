// === WebKurier Terminal v2.1 — CLI-интерфейс с WebCoin ===

const terminalInput = document.getElementById("terminal-input");
const terminalLog = document.getElementById("terminal-log");

// Словарь команд
const commands = {
  help: () => {
    return `📘 Команды:\n` +
           `• help — показать команды\n` +
           `• ping — проверка связи\n` +
           `• info — информация о системе\n` +
           `• balance — баланс WebCoin\n` +
           `• add — добавить 10 WKC\n` +
           `• reset — сбросить баланс\n` +
           `• clear — очистить терминал\n` +
           `• date — текущая дата и время`;
  },
  ping: () => "Pong 🟢",
  info: () => "WebKurierCore v1.0 — автономный терминал и WebCoin",
  balance: () => {
    const coins = localStorage.getItem("webcoin_balance") || "0";
    return `Баланс: ${coins} WKC`;
  },
  add: () => {
    let coins = parseInt(localStorage.getItem("webcoin_balance") || "0");
    coins += 10;
    localStorage.setItem("webcoin_balance", coins);
    updateBalanceUI();
    return `✅ Добавлено 10 WKC. Новый баланс: ${coins} WKC`;
  },
  reset: () => {
    localStorage.setItem("webcoin_balance", "0");
    updateBalanceUI();
    return `🔁 Баланс сброшен до 0 WKC`;
  },
  clear: () => {
    terminalLog.innerHTML = '';
    return null;
  },
  date: () => new Date().toLocaleString("ru-RU")
};

// Обработка ввода команды
function handleCommand(event) {
  if (event.key === "Enter") {
    const cmd = terminalInput.value.trim().toLowerCase();
    if (!cmd) return;

    printToTerminal(`> ${cmd}`);

    if (commands[cmd]) {
      const result = commands[cmd]();
      if (result) printToTerminal(result);
    } else {
      printToTerminal(`⛔ Неизвестная команда: "${cmd}". Напиши "help"`);
    }

    terminalInput.value = '';
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }
}

// Вывод текста в терминал
function printToTerminal(text) {
  terminalLog.innerHTML += `<div>${text}</div>`;
}

// Обновление UI-баланса в блоке WebCoin
function updateBalanceUI() {
  const balanceElement = document.getElementById("wallet-balance");
  if (balanceElement) {
    const coins = localStorage.getItem("webcoin_balance") || "0";
    balanceElement.innerText = `${coins} WKC`;
  }
}

// Инициализация (обновим баланс при загрузке)
updateBalanceUI();