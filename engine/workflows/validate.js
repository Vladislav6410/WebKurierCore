/**
 * Минимальная валидация workflow структуры.
 * Не заменяет JSON Schema, но ловит критические ошибки.
 */
export function validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== "object") throw new Error("workflow must be an object");
  if (!workflow.id) throw new Error("workflow.id is required");
  if (!workflow.name) throw new Error("workflow.name is required");
  if (!workflow.trigger || !workflow.trigger.type) throw new Error("workflow.trigger.type is required");
  if (!Array.isArray(workflow.steps)) throw new Error("workflow.steps must be array");
  if (!Array.isArray(workflow.edges)) throw new Error("workflow.edges must be array");

  const stepIds = new Set();
  for (const s of workflow.steps) {
    if (!s.id || !s.type) throw new Error("each step requires id and type");
    if (stepIds.has(s.id)) throw new Error(`duplicate step id: ${s.id}`);
    stepIds.add(s.id);
  }

  const hasStart = workflow.edges.some(e => e.from === "start");
  if (!hasStart) throw new Error("workflow must include at least one edge from 'start'");

  return true;
}