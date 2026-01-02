/**
 * Security Gate for WebKurierCore Workflows
 *
 * Роль:
 * - Санитизация входного payload (webhook/manual/schedule)
 * - Валидация URL для http.request step (через Security)
 *
 * ВАЖНО:
 * - WebKurierCore НЕ реализует безопасность сам.
 * - Он вызывает WebKurierSecurity как policy gate.
 *
 * Здесь реализованы:
 * - fallback-адаптеры (если Security репо не подключено)
 * - единая точка входа для runner/steps
 */

let sanitizeIncomingPayloadFn = null;
let validateUrlFn = null;

export function configureSecurityGate({ sanitizeIncomingPayload, validateUrl } = {}) {
  sanitizeIncomingPayloadFn = sanitizeIncomingPayload || null;
  validateUrlFn = validateUrl || null;
}

export function sanitizeInputPayload(input, policies = {}) {
  const enabled = policies.security_sanitize_payload !== false;

  if (!enabled) return input;

  if (!sanitizeIncomingPayloadFn) {
    // fallback: без санитизации — но не падаем (MVP)
    return input;
  }

  const res = sanitizeIncomingPayloadFn(input, { strict: true });
  // поддержка формата {ok, payload}
  if (res && typeof res === "object" && "payload" in res) return res.payload;
  return res;
}

export function validateExternalUrl(url, policies = {}) {
  const enabled = policies.security_validate_urls !== false;

  if (!enabled) return { ok: true };

  if (!validateUrlFn) {
    // fallback: минимальная проверка
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error("Only https URLs allowed (fallback)");
    return { ok: true, via: "fallback" };
  }

  return validateUrlFn(url);
}