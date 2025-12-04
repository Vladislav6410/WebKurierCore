// terminal.js

import CONFIG from "./engine/config.js";
import { handleTranslatorCommand, isTranslatorCommand } from "./engine/agents/translator/ui/terminal-bridge.js";

const currentUserId = (CONFIG && CONFIG.user && CONFIG.user.id) || "local-user";

// --- Базовые команды ---
const commands = {
  "/help": {
    description: "Список команд",
    exec: () => Object.entries(commands)
      .map(([cmd, obj]) => `${cmd} — ${obj.description}`)
      .join("\n")
  },
  "/config": {
    description: "Показать конфигурацию",
    exec: () => "⚙️ Конфиг:\n" + JSON.stringify(CONFIG, null, 2)
  }
  // ...добавляй свои базовые команды (баланс, reset, clear и т.д.)...
};

// === MasterAgent ===
if (CONFIG.features?.master) {
  import("./engine/agents/master-agent.js").then((MasterAgent) => {
    commands["/agents"] = {
      description: "Список активных агентов",
      exec: async () => {
        const agents = await MasterAgent.listActiveAgents();
        return "🤖 Активные агенты:\n" + agents.map(a => `- ${a.name} (v${a.version})`).join("\n");
      }
    };
    commands["/tip"] = {
      description: "Отправить WebCoin агенту: /tip [имя] [сумма]",
      exec: async ([agent, amount]) => {
        const result = await MasterAgent.sendCoins(agent, parseInt(amount, 10));
        return result.success
          ? `📤 ${amount} WebCoin отправлено агенту ${agent}`
          : `❌ Ошибка: ${result.error}`;
      }
    };
    commands["/market"] = {
      description: "Показать курсы WebCoin",
      exec: async () => {
        const rates = await MasterAgent.getExchangeRates();
        return "📈 Курсы:\n" + Object.entries(rates).map(([cur, rate]) => `- 1 WC = ${rate} ${cur}`).join("\n");
      }
    };
    commands["/status"] = {
      description: "Статус агента: /status [имя]",
      exec: ([name]) => MasterAgent.status?.[name] || "❓ Неизвестно"
    };
    commands["/reload"] = {
      description: "Перезагрузить агента: /reload [имя]",
      exec: ([name]) => {
        MasterAgent.reload(name);
        return `🔁 Перезагрузка агента "${name}"...`;
      }
    };
  });
}

// === TranslatorAgent ===
if (CONFIG.features?.translator) {
  import("./engine/agents/translator/translator-agent.js").then((TranslatorAgent) => {
    // Классический режим: /translate [lang] [text]
    commands["/translate"] = {
      description: "Перевести текст: /translate [язык] [текст]",
      exec: async ([lang, ...text]) => {
        const result = await TranslatorAgent.translate(text.join(" "), lang);
        return `🌐 Перевод (${lang}): ${result}`;
      }
    };
    commands["/lang"] = {
      description: "Показать языки",
      exec: async () => {
        const langs = await TranslatorAgent.getLanguages();
        return "🌍 Языки: " + langs.join(", ");
      }
    };
    commands["/detect"] = {
      description: "Определить язык",
      exec: async ([...text]) => {
        const lang = await TranslatorAgent.detect(text.join(" "));
        return `🔎 Язык: ${lang}`;
      }
    };

    // (опционально) сюда можно добавить явные алиасы /spanish, /russian и т.п.,
    // если захочешь дублировать Abang-режим через таблицу команд, а не через bridge.
  });
}

// === DropboxAgent ===
if (CONFIG.features?.dropbox) {
  import("./engine/agents/dropbox/dropbox-agent.js").then((DropboxAgent) => {
    commands["/save"] = {
      description: "Сохранить в Dropbox",
      exec: async () => {
        // Пример: сохраняем баланс
        await DropboxAgent.uploadFile("wallet_backup.json", JSON.stringify({ balance: 100 }));
        return "📦 Файл сохранён в Dropbox.";
      }
    };
    commands["/load"] = {
      description: "Загрузить из Dropbox",
      exec: async () => {
        const text = await DropboxAgent.downloadFile("wallet_backup.json");
        const json = JSON.parse(text);
        // setBalance(json.balance);
        return `📥 Баланс восстановлен: ${json.balance} WebCoin.`;
      }
    };
    commands["/list"] = {
      description: "Список файлов Dropbox",
      exec: async () => {
        const files = await DropboxAgent.listFiles();
        return "🗃 Файлы: " + files.join(", ");
      }
    };
    commands["/backup"] = {
      description: "Резервная копия в Dropbox",
      exec: async () => {
        // ...логика бэкапа...
        return "✅ Резервная копия создана.";
      }
    };
  });
}

// === LegalAgent ===
if (CONFIG.features?.legal) {
  import("./engine/agents/legal/legal-agent.js").then((LegalAgent) => {
    commands["/legal"] = {
      description: "Юридическая помощь: analyze/template/help",
      exec: async ([action, ...args]) => {
        if (action === "analyze") return await LegalAgent.analyze(args.join(" "));
        if (action === "template") return await LegalAgent.template(args.join(" "));
        if (action === "help") return await LegalAgent.help();
        return "Доступные: analyze, template, help";
      }
    };
  });
}

// === ToolsAgent ===
if (CONFIG.features?.tools) {
  import("./engine/agents/tools/tools-agent.js").then((ToolsAgent) => {
    commands["/build"] = {
      description: "Сгенерировать HTML",
      exec: async ([...args]) => await ToolsAgent.build(args.join(" "))
    };
    commands["/preview"] = {
      description: "Предпросмотр HTML",
      exec: async ([...args]) => await ToolsAgent.preview(args.join(" "))
    };
    commands["/exportzip"] = {
      description: "Экспортировать ZIP",
      exec: async () => await ToolsAgent.exportZip()
    };
  });
}

// === LayoutAgent ===
if (CONFIG.features?.layout) {
  import("./engine/agents/layout/layout-agent.js").then((LayoutAgent) => {
    commands["/layout"] = {
      description: "Вёрстка: build/fixcss",
      exec: async ([action, ...args]) => {
        if (action === "build") return await LayoutAgent.build(args.join(" "));
        if (action === "fixcss") return await LayoutAgent.fixCss(args.join(" "));
        return "Доступные: build, fixcss";
      }
    };
  });
}

// === BudgetAgent ===
if (CONFIG.features?.budget) {
  import("./engine/agents/budget/budget-agent.js").then((BudgetAgent) => {
    commands["/budget"] = {
      description: "Бюджет: add/chart",
      exec: async ([action, ...args]) => {
        if (action === "add") return await BudgetAgent.add(args.join(" "));
        if (action === "chart") return await BudgetAgent.chart();
        return "Доступные: add, chart";
      }
    };
  });
}

// === ReportAgent ===
if (CONFIG.features?.report) {
  import("./engine/agents/report/report-agent.js").then((ReportAgent) => {
    commands["/report"] = {
      description: "Отчёты: generate/last",
      exec: async ([action, ...args]) => {
        if (action === "generate") return await ReportAgent.generate(args.join(" "));
        if (action === "last") return await ReportAgent.last();
        return "Доступные: generate, last";
      }
    };
  });
}

// === ModuleAgent ===
if (CONFIG.features?.module) {
  import("./engine/agents/module/module-agent.js").then((ModuleAgent) => {
    commands["/module"] = {
      description: "Модули: list/enable",
      exec: async ([action, ...args]) => {
        if (action === "list") return await ModuleAgent.list();
        if (action === "enable") return await ModuleAgent.enable(args[0]);
        return "Доступные: list, enable";
      }
    };
  });
}

// === AIHelperAgent ===
if (CONFIG.features?.aihelper) {
  import("./engine/agents/aihelper/aihelper-agent.js").then((AIHelperAgent) => {
    commands["/ai"] = {
      description: "AI-помощник: suggest/help",
      exec: async ([action, ...args]) => {
        if (action === "suggest") return await AIHelperAgent.suggest(args.join(" "));
        if (action === "help") return await AIHelperAgent.help();
        return "Доступные: suggest, help";
      }
    };
  });
}

// === NavigatorAgent ===
if (CONFIG.features?.navigator) {
  import("./engine/agents/navigator/navigator-agent.js").then((NavigatorAgent) => {
    commands["/nav"] = {
      description: "Навигация: start/location",
      exec: async ([action, ...args]) => {
        if (action === "start") return await NavigatorAgent.start(args.join(" "));
        if (action === "location") return await NavigatorAgent.location();
        return "Доступные: start, location";
      }
    };
  });
}

// === MarketingAgent ===
if (CONFIG.features?.marketing) {
  import("./engine/agents/marketing/marketing-agent.js").then((MarketingAgent) => {
    commands["/ads"] = {
      description: "Маркетинг: idea/slogan",
      exec: async ([action, ...args]) => {
        if (action === "idea") return await MarketingAgent.idea(args.join(" "));
        if (action === "slogan") return await MarketingAgent.slogan(args.join(" "));
        return "Доступные: idea, slogan";
      }
    };
  });
}

// === WalletAgent ===
if (CONFIG.features?.wallet) {
  import("./engine/agents/wallet/wallet-agent.js").then((WalletAgent) => {
    commands["/wallet"] = {
      description: "Кошелёк: send/export",
      exec: async ([action, ...args]) => {
        if (action === "send") return await WalletAgent.send(args[0], args[1]);
        if (action === "export") return await WalletAgent.export();
        return "Доступные: send, export";
      }
    };
  });
}

// --- Обработка команд ---
async function handleCommand(event) {
  if (event.key === "Enter" || event.type === "run") {
    const input = document.getElementById("terminal-input");
    const cmd = input.value.trim();
    input.value = "";
    if (!cmd) return;

    printToTerminal("> " + cmd);

    // 1. Abang-режим переводчика: /spanish text, /arabic text, /japanese text, /russian text,
    //    а также /translate и /config в стиле UX Abang.
    if (cmd.startsWith("/")) {
      try {
        if (isTranslatorCommand(cmd)) {
          const result = await handleTranslatorCommand(cmd, { userId: currentUserId });
          if (result) {
            const header =
              result.provider && result.provider !== "none"
                ? `[${result.langCode} • ${result.provider}]`
                : `[${result.langCode}]`;

            if (result.showOriginal && result.original) {
              printToTerminal(`${header} ${result.translated}`);
              printToTerminal(`(orig) ${result.original}`);
            } else {
              printToTerminal(`${header} ${result.translated}`);
            }
          }
          return; // не передаём эту строку в общий commands[]
        }
      } catch (err) {
        printToTerminal("⚠️ Ошибка переводчика: " + err, true);
        return;
      }
    }

    // 2. Общие команды терминала через registry commands{}
    const [command, ...args] = cmd.split(" ");
    const action = commands[command];

    if (!action) {
      printToTerminal("❌ Неизвестная команда. Введите /help", true);
      return;
    }

    try {
      const result = await action.exec(args);
      if (result) printToTerminal(result);
    } catch (err) {
      printToTerminal("⚠️ " + err, true);
    }
  }
}

// --- Инициализация ---
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("terminal-input");
  if (input) input.addEventListener("keydown", handleCommand);
});

// --- Вывод в терминал ---
function printToTerminal(message, isError = false) {
  const output = document.getElementById("terminal-output") || document.getElementById("terminal-log");
  if (!output) return;
  const line = document.createElement("div");
  line.textContent = message;
  line.style.color = isError ? "red" : "white";
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}


