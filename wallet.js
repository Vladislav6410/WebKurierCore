// === wallet.js — WebCoin Кошелёк + Dropbox Memory + DreamMaker ===

// ① WALLET — баланс
const WALLET_KEY = "webcoin_balance";
function getBalance() { return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10); }
function setBalance(amount) { localStorage.setItem(WALLET_KEY, amount); updateBalanceUI(); }
function addCoins(amount) { setBalance(getBalance() + amount); }
function resetCoins() { setBalance(0); }

function updateBalanceUI() {
  const amount = getBalance();
  ["balance","webcoin-balance","balance-display"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = id === "balance" ? amount : `Баланс: ${amount} WKC`;
  });
}

// ② WALLET-Команды
const walletCommands = {
  "/add": { description:"/add [число] — добавить монеты", exec: args => {
    const amount = parseInt(args[0]||"10",10);
    if (isNaN(amount)||amount<=0) throw "Введите положительное число.";
    addCoins(amount);
    return `✅ Добавлено ${amount} WKC.`;
  }},
  "/reset": { description:"/reset — сбросить баланс", exec: () => { resetCoins(); return "🔁 Баланс сброшен."; }},
  "/balance": { description:"/balance — показать баланс", exec: () => `💰 Баланс: ${getBalance()} WKC.` },
  "/set": { description:"/set [число] — установить баланс", exec: args => {
    const amount = parseInt(args[0],10);
    if (isNaN(amount)||amount<0) throw "Введите корректное число.";
    setBalance(amount);
    return `🔧 Баланс установлен: ${amount} WKC.`;
  }},
  "/export": { description:"/export — сохранить баланс в файл", exec: () => {
    const data = JSON.stringify({ balance: getBalance() });
    const blob = new Blob([data],{type:"application/json"});
    const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"wallet.json"});
    a.click();
    return "💾 Баланс сохранён.";
  }},
  "/import": { description:"/import — загрузить баланс из файла", exec: () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      new FileReader().addEventListener("load", ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (typeof data.balance === "number") {
            setBalance(data.balance);
            printToTerminal(`📥 Баланс загружен: ${data.balance} WKC`);
          } else throw "Неверный формат.";
        } catch (e) {
          printToTerminal(`⚠️ Ошибка: ${e}`, true);
        }
      }).readAsText(file);
    };
    input.click();
    return "📂 Выберите файл.";
  }}
};

// ③ ENGINEER — Dropbox Memory команды (из engine/engineer.js)
const engineerCommands = {
  "/add-note": { description:"/add-note [текст] — добавить заметку", exec: args => handleEngineerCommand("/add "+args.join(" ")) },
  "/save":     { description:"/save — сохранить заметки в Dropbox", exec: () => handleEngineerCommand("/save") },
  "/load":     { description:"/load — загрузить заметки", exec: () => handleEngineerCommand("/load") },
  "/config":   { description:"/config — загрузить конфиг", exec: () => handleEngineerCommand("/config") },
  "/clear":    { description:"/clear — очистить память", exec: () => handleEngineerCommand("/clear") },
};

// ④ DREAMMAKER — генерация медиа
const dreamCommands = {
  "/dream-status": { description:"/dream-status — статус DreamMaker", exec: () => window.dreammaker?.status() || "❌ DreamMaker не загружен." },
  "/dream-video":  { description:"/dream-video [имя_файла] — 3D из видео", exec: ([name]) =>
    window.dreammaker ? window.dreammaker.fromVideo({name}) : "❌ Нет DreamMaker."
  },
  "/dream-photo":  { description:"/dream-photo [фото] [аудио] — оживить фото", exec: ([p,a]) =>
    window.dreammaker ? window.dreammaker.animate({name:p},{name:a}) : "❌ Нет DreamMaker."
  },
  "/dream-voice":  { description:"/dream-voice [текст] — озвучить текст", exec: ([...txt]) =>
    window.dreammaker ? window.dreammaker.voiceOver(txt.join(" ")) : "❌ Нет DreamMaker."
  }
};

// ⑤ ВСЕ КОМАНДЫ вместе
const allCommands = {
  ...walletCommands,
  ...engineerCommands,
  ...dreamCommands,
  "/help": { description:"/help — список всех команд", exec: () =>
    Object.entries(allCommands).map(([c,o])=>`${c}: ${o.description}`).join("\n")
  }
};

// ⑥ ОБРАБОТЧИК команд
async function handleWalletCommand(command) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  const entry = allCommands[cmd];
  if (!entry) return "❌ Неизвестная команда. Используй /help.";
  try {
    const res = await entry.exec(args);
    return res;
  } catch (e) {
    return `⚠️ ${e}`;
  }
}

// ⑦ Вывод в терминал
function printToTerminal(msg, isError=false) {
  const out = document.getElementById("terminal-output");
  if (!out) return;
  const line = document.createElement("div");
  line.textContent = msg;
  line.style.color = isError ? "red" : "lime";
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

// ⑧ История
let commandHistory = [], historyIndex = -1;

// ⑨ Запуск интерфейса
window.addEventListener("DOMContentLoaded", () => {
  // Автозагрузка памяти и конфига
  if (typeof handleEngineerCommand === "function") {
    handleEngineerCommand("/load").then(printToTerminal);
    handleEngineerCommand("/config").then(printToTerminal);
  }
  updateBalanceUI();

  const input = document.getElementById("terminal-input");
  const btn   = document.getElementById("execute-command");

  async function run() {
    const cmd = input.value.trim();
    if (!cmd) return;
    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    if (commandHistory.length>50) commandHistory.pop();
    historyIndex = -1;
    const res = await handleWalletCommand(cmd);
    printToTerminal(res, res.startsWith("⚠️")||res.startsWith("❌"));
    updateBalanceUI();
    input.value = "";
  }

  btn?.addEventListener("click", run);
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") run();
    if (e.key === "ArrowUp") {
      if (commandHistory.length && historyIndex < commandHistory.length-1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      }
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = -1;
        input.value = "";
      }
      e.preventDefault();
    }
  });
});