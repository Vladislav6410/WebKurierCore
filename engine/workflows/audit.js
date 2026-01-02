/**
 * MVP audit emitter.
 * Сейчас — пишет в консоль/терминал.
 * Потом — подключим WebKurierChain (append-only).
 */
export function createAuditEmitter({ terminal } = {}) {
  return async function emitAudit(event) {
    const line = `[audit] ${JSON.stringify(event)}`;
    if (terminal?.print) terminal.print(line);
    else console.log(line);
  };
}