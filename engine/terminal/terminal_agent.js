/**
 * WebKurier Terminal Agent
 *
 * Роль:
 * - Центральная CLI-точка управления Core
 * - Регистрирует команды
 * - Подключает workflow runtime
 * - Инициализирует Security bridge
 */

import { registerWorkflowCommand } from "./commands/workflow.js";
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
   * Регистрация команды
   */
  registerCommand(name, handler) {
    this.commands.set(name, handler);
  }

  /**
   * Вывод в терминал
   */
  print(message) {
    if (typeof message === "object") {
      console.log(JSON.stringify(message, null, 2));
    } else {
      console.log(message);
    }
  }

  /**
   * Выполнение строки команды
   * Пример:
   *   /workflow run engine/workflows/examples/transform_only.workflow.json
   */
  async execute(line) {
    if (!line) return;

    const clean = line.trim();
    if (!clean.startsWith("/")) {
      this.print("Commands must start with /");
      return;
    }

    const parts = clean.slice(1).split(" ").filter(Boolean);
    const command = parts.shift();
    const args = parts;

    const handler = this.commands.get(command);
    if (!handler) {
      this.print(`Unknown command: ${command}`);
      return;
    }

    try {
      await handler(args);
    } catch (err) {
      this.print(`Error: ${err.message || err}`);
    }
  }
}

/**
 * Factory — создаёт и инициализирует терминал
 */
export async function createTerminalAgent() {
  const terminal = new TerminalAgent();

  // 🔐 Инициализация Security bridge (WebKurierSecurity или fallback)
  const securityStatus = await initSecurityBridge();
  terminal.print(`[security] ${securityStatus.mode}`);

  // 🔁 Регистрация workflow-команд
  registerWorkflowCommand(terminal);

  terminal.print("TerminalAgent ready. Type /workflow help");

  return terminal;
}