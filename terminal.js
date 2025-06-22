// === WebKurier Terminal v2.0 — CLI-интерфейс ===

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
           `• clear — очистить терминал\n` +
           `• date — текущая дата и время`;
  },
  ping: () => "Pong 🟢",
  info: () => "WebKurierCore v1.0 — автономный терминал и WebCoin",
  balance: () => {
    const coins = localStorage.getItem("webcoin_balance") || "0";
    return `Баланс: ${coins} WKC`;
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