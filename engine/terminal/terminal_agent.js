/**
 * WebKurier Terminal Agent
 *
 * Роль:
 * - Центральная CLI-точка управления Core
 * - Регистрирует команды
 * - Подключает workflow runtime (SQLite)
 * - Инициализирует Security bridge
 */
import { bootstrapEngineerCodex } from "./bootstrap-codex.js";
import { createWorkflowRuntime } from "../workflows/index.js";

import { registerWorkflowCommand } from "./commands/workflow.js";
import { registerApprovalsCommands } from "./commands/approvals.commands.js";

import { initSecurityBridge } from "../workflows/securityBridge.js";

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
   * Пример:
   *   /workflow run engine/workflows/examples/transform_only.workflow.json
   *   /approvals list
   */
  async execute(line) {
    if (!line) return;

    const clean = String(line).trim();
    if (!clean.startsWith("/")) {
      this.print("Commands must start with /");
      return;
    }

    // берём имя команды полностью: "/workflow", "/approvals"
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
  // registerWorkflowCommand должен уметь принимать runtime.
  // Если у тебя старая версия registerWorkflowCommand(terminal) — обновим на шаге 2/4 (следующий файл).
  registerWorkflowCommand(terminal, runtime);

  // ✅ /approvals
  registerApprovalsCommands(terminal, runtime);

  terminal.print("TerminalAgent ready. Try: /workflow help");
  terminal.print("Also: /approvals help");

  return terminal;
}
