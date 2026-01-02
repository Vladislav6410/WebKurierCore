/**
 * Bridge to WebKurierSecurity.
 *
 * Если репозиторий WebKurierSecurity подключён (submodule/monorepo),
 * импортируем реальные функции.
 *
 * Если нет — gate будет работать в fallback режиме (см. securityGate.js).
 */

import { configureSecurityGate } from "./securityGate.js";

export async function initSecurityBridge() {
  try {
    // Вариант 1: если Security лежит рядом как модуль (подстрой путь под твой проект)
    const mod = await import("../../../WebKurierSecurity/engine/validation/payload-sanitizer.js");
    const urlMod = await import("../../../WebKurierSecurity/engine/validation/url-validator.js");

    configureSecurityGate({
      sanitizeIncomingPayload: mod.sanitizeIncomingPayload,
      validateUrl: urlMod.validateUrl
    });

    return { ok: true, mode: "webkuriersecurity" };
  } catch (e) {
    // Fallback
    configureSecurityGate({});
    return { ok: true, mode: "fallback", note: "WebKurierSecurity not linked; using fallback validation" };
  }
}