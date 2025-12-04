// engine/agents/translator/command-parser.js

/**
 * Разбирает строку вида:
 *   /spanish Hello everyone
 *   /config showOriginal off
 *   /translate
 *
 * Возвращает:
 *   {
 *     command: 'spanish',   // без слеша, в нижнем регистре
 *     args: ['Hello', 'everyone'],
 *     text: 'Hello everyone'
 *   }
 */
export function parseCommand(line) {
  if (!line || typeof line !== "string") {
    return { command: "", args: [], text: "" };
  }

  const trimmed = line.trim().replace(/^\/+/, ""); // убираем ведущие /
  if (!trimmed) {
    return { command: "", args: [], text: "" };
  }

  const parts = trimmed.split(/\s+/);
  const command = (parts.shift() || "").toLowerCase();
  const args = parts;
  const text = args.join(" ");

  return { command, args, text };
}