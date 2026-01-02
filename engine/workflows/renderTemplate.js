/**
 * Простая подстановка шаблонов вида:
 *  {{input.foo}}
 *  {{results.stepId.someField}}
 * Используется в ai.prompt и др.
 */
export function renderTemplate(template, { input = {}, results = {} } = {}) {
  if (typeof template !== "string") return template;

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const path = expr.trim();
    const value = getByPath({ input, results }, path);
    return value === undefined || value === null ? "" : String(value);
  });
}

function getByPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}