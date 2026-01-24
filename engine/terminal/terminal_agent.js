/**
 * WebKurier Terminal Agent
 *
 * Роль:
 * - Центральная CLI-точка управления Core
 * - Регистрирует команды
 * - Подключает workflow runtime (SQLite)
 * - Инициализирует Security bridge
 * - Подключает EngineerAgent (включая Codex-mode через bootstrapEngineerCodex)
 * - Подключает TelemetryBridge (/telemetry ...), пишет логи телеметрии
 */

import { createWorkflowRuntime } from "../workflows/index.js";

import { registerWorkflowCommand } from "./commands/workflow.js";
import { registerApprovalsCommands } from "./commands/approvals.commands.js";

import { initSecurityBridge } from "../workflows/securityBridge.js";

import { bootstrapEngineerCodex } from "./bootstrap-codex.js";

// Важно: путь должен соответствовать реальному файлу в engine/agents/engineer/
import { createEngineerAgent } from "../agents/engineer/engineer-agent.js";

// 📡 ESP32 Telemetry bridge
import { TelemetryBridge } from "../agents/telemetry/telemetry-bridge.js";

/**
 * Простейшая реализация terminal API.
 * Если у тебя уже есть terminal object — адаптируй только register/print.
 */
export class TerminalAgent {
  constructor() {
    this.commands = new Map();
  }

  /**
   * Регистрация команды.
   * ВНИМАНИЕ: здесь name ожидается как "/workflow" или "/approvals"
   */
  registerCommand(name, handler) {
    this.commands.set(name, handler);
  }

  /**
   * Вывод в терминал
   */
  print(message) {
    if (typeof message === "object") {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(message, null, 2));
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  /**
   * Выполнение строки команды
   */
  async execute(line) {
    if (!line) return;

    const clean = String(line).trim();
    if (!clean.startsWith("/")) {
      this.print("Commands must start with /");
      return;
    }

    const firstSpace = clean.indexOf(" ");
    const name = firstSpace === -1 ? clean : clean.slice(0, firstSpace);
    const argsLine = firstSpace === -1 ? "" : clean.slice(firstSpace + 1);

    const handler = this.commands.get(name);
    if (!handler) {
      this.print(`Unknown command: ${name}`);
      this.print("Try: /workflow help");
      return;
    }

    try {
      await handler(argsLine);
    } catch (err) {
      this.print(`Error: ${err?.message || err}`);
    }
  }
}

/**
 * Привязка EngineerAgent к терминалу:
 * - /engineer ... → EngineerAgent handler
 * Важно: конкретный метод EngineerAgent может отличаться — поддерживаем несколько вариантов.
 */
function mountEngineerAgent(terminal, engineerAgent) {
  terminal.registerCommand("/engineer", async (argsLine) => {
    // Вариант 1: engineerAgent.execute(argsLine)
    if (typeof engineerAgent.execute === "function") {
      return engineerAgent.execute(argsLine);
    }

    // Вариант 2: engineerAgent.handle(argsLine)
    if (typeof engineerAgent.handle === "function") {
      return engineerAgent.handle(argsLine);
    }

    // Вариант 3: engineerAgent.run(argsLine)
    if (typeof engineerAgent.run === "function") {
      return engineerAgent.run(argsLine);
    }

    terminal.print(
      "[engineer] Cannot mount EngineerAgent: expected method execute() or handle() or run(). " +
        "Please adapt mountEngineerAgent() to your EngineerAgent API."
    );
    return null;
  });
}

/**
 * Factory — создаёт и инициализирует терминал
 */
export async function createTerminalAgent() {
  const terminal = new TerminalAgent();

  // 🔐 Security bridge
  const securityStatus = await initSecurityBridge();
  terminal.print(`[security] ${securityStatus?.mode || "unknown"}`);

  // 🔁 Один общий workflow runtime (SQLite)
  const runtime = createWorkflowRuntime({ dbPath: "data/workflows.sqlite" });
  terminal.print("[workflows] runtime ready (sqlite)");

  // ✅ /workflow
  registerWorkflowCommand(terminal, runtime);

  // ✅ /approvals
  registerApprovalsCommands(terminal, runtime);

  // 🛠 EngineerAgent (и Codex-mode внутри Engineer)
  const engineerAgent = createEngineerAgent({ terminal });

  // ✅ Вшиваем Codex-mode в EngineerAgent (ВАЖНО: await)
  await bootstrapEngineerCodex({ engineerAgent });

  // ✅ Монтируем EngineerAgent в терминал как /engineer ...
  mountEngineerAgent(terminal, engineerAgent);

  // 📡 Telemetry bridge (ESP32 Wi-Fi agent)
  // Регистрирует команду /telemetry ...
  TelemetryBridge.register(terminal);

  terminal.print("TerminalAgent ready. Try: /workflow help");
  terminal.print("Also: /approvals help");
  terminal.print("Engineer: /engineer codex on");
  terminal.print("Telemetry: /telemetry help");

  return terminal;
}