// === WebKurier Terminal — v1.0 ===

// Команды терминала
const commands = {
  ping: () => appendOutput("Pong 🟢"),
  help: () => appendOutput("Доступные команды: ping, help, info, balance"),
  info: () => appendOutput("WebKurierCore v1.0 — терминал, кошелёк, офлайн-доступ"),
  balance: () => {
    const coins = parseInt(localStorage.getItem('webcoin') || '0');
    appendOutput(`Баланс: ${coins} WKC`);
  }
};

// Обработчик команды (по Enter)
function handleCommand(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("terminal-input");
    const log = document.getElementById("terminal-log");
    const cmd = input.value.trim().toLowerCase();
    if (!cmd) return;

    log.innerHTML += `<div>&gt; ${cmd}</div>`;

    if (commands[cmd]) {
      commands[cmd]();
    } else {
      appendOutput(`Неизвестная команда: "${cmd}". Напиши "help"`);
    }

    log.scrollTop = log.scrollHeight;
    input.value = "";
  }
}

// Добавить текст в терминал
function appendOutput(text) {
  const log = document.getElementById("terminal-log");
  log.innerHTML += `<div>${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

// Автофокус при загрузке
window.addEventListener("load", () => {
  const input = document.getElementById("terminal-input");
  if (input) {
    setTimeout(() => input.focus(), 500);
  }
});