import config from "./wallet-config.json" assert { type: "json" };// === wallet-agent.js — WebCoin Кошелёк (модуль) ===

// === ① Баланс ===
const WALLET_KEY = "webcoin_balance";

export function getBalance() {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10);
}

export function setBalance(amount) {
  localStorage.setItem(WALLET_KEY, amount);
  updateBalanceUI();
}

export function addCoins(amount) {
  setBalance(getBalance() + amount);
}

export function resetCoins() {
  setBalance(0);
}

export function updateBalanceUI() {
  const amount = getBalance();
  ["balance", "webcoin-balance", "balance-display"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = id === "balance" ? amount : `Баланс: ${amount} WKC`;
  });
}

// === ② Команды WALLET ===
const walletCommands = {
  "/add": {
    description: "/add [число] — добавить монеты",
    exec: args => {
      const amount = parseInt(args[0] || "10", 10);
      if (isNaN(amount) || amount <= 0) throw "Введите положительное число.";
      addCoins(amount);
      return `✅ Добавлено ${amount} WKC.`;
    }
  },
  "/reset": {
    description: "/reset — сбросить баланс",
    exec: () => {
      resetCoins();
      return "🔁 Баланс сброшен.";
    }
  },
  "/balance": {
    description: "/balance — показать баланс",
    exec: () => `💰 Баланс: ${getBalance()} WKC.`
  },
  "/set": {
    description: "/set [число] — установить баланс",
    exec: args => {
      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount < 0) throw "Введите корректное число.";
      setBalance(amount);
      return `🔧 Баланс установлен: ${amount} WKC.`;
    }
  },
  "/export": {
    description: "/export — сохранить баланс в файл",
    exec: () => {
      const data = JSON.stringify({ balance: getBalance() });
      const blob = new Blob([data], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: "wallet.json"
      });
      a.click();
      return "💾 Баланс сохранён.";
    }
  },
  "/import": {
    description: "/import — загрузить баланс из файла",
    exec: (args, printToTerminal) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
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
        });
        new FileReader().readAsText(file);
      };
      input.click();
      return "📂 Выберите файл.";
    }
  }
};

// === ③ Команды ENGINEER (обёртки над /engine/engineer.js) ===
const engineerCommands = {
  "/add-note": {
    description: "/add-note [текст] — добавить заметку",
    exec: (args, _, handleEngineerCommand) => handleEngineerCommand("/add " + args.join(" "))
  },
  "/save": {
    description: "/save — сохранить заметки в Dropbox",
    exec: (_, __, handleEngineerCommand) => handleEngineerCommand("/save")
  },
  "/load": {
    description: "/load — загрузить заметки",
    exec: (_, __, handleEngineerCommand) => handleEngineerCommand("/load")
  },
  "/config": {
    description: "/config — загрузить конфиг",
    exec: (_, __, handleEngineerCommand) => handleEngineerCommand("/config")
  },
  "/clear": {
    description: "/clear — очистить память",
    exec: (_, __, handleEngineerCommand) => handleEngineerCommand("/clear")
  }
};

// === ④ Команды DREAMMAKER (оживление, озвучка, генерация) ===
const dreamCommands = {
  "/dream-status": {
    description: "/dream-status — статус DreamMaker",
    exec: () => window.dreammaker?.status() || "❌ DreamMaker не загружен."
  },
  "/dream-video": {
    description: "/dream-video [имя_файла] — 3D из видео",
    exec: ([name]) => window.dreammaker?.fromVideo({ name }) || "❌ Нет DreamMaker."
  },
  "/dream-photo": {
    description: "/dream-photo [фото] [аудио] — оживить фото",
    exec: ([p, a]) => window.dreammaker?.animate({ name: p }, { name: a }) || "❌ Нет DreamMaker."
  },
  "/dream-voice": {
    description: "/dream-voice [текст] — озвучить текст",
    exec: ([...txt]) => window.dreammaker?.voiceOver(txt.join(" ")) || "❌ Нет DreamMaker."
  }
};

// === ⑤ Все команды вместе ===
export const walletAgentCommands = {
  ...walletCommands,
  ...engineerCommands,
  ...dreamCommands,
  "/help": {
    description: "/help — список всех команд",
    exec: () =>
      Object.entries(walletAgentCommands)
        .map(([c, o]) => `${c}: ${o.description}`)
        .join("\n")
  }
};

// === ⑥ Обработка команд
export async function handleWalletCommand(command, printToTerminal, handleEngineerCommand) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  const entry = walletAgentCommands[cmd];
  if (!entry) return "❌ Неизвестная команда. Используй /help.";

  try {
    const res = await entry.exec(args, printToTerminal, handleEngineerCommand);
    return res;
  } catch (e) {
    return `⚠️ ${e}`;
  }
}