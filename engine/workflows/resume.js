import { runWorkflow } from "./runner.js";

/**
 * Resume: повторно запускаем workflow, но учитываем уже выполненные шаги.
 * MVP: мы просто заново запускаем, но runner пропустит уже сохранённые stepResults.
 * (Ниже это обеспечим в runner через "skip if exists")
 */
export async function resumeWorkflow({ workflow, registry, store, runId, emitAudit }) {
  const run = store.getRun(runId);
  if (!run) throw new Error("Run not found");

  // продолжение идёт с тем же input и уже накопленными stepResults
  return runWorkflow({
    workflow,
    registry,
    store,
    input: run.input,
    emitAudit,
    resumeFromRunId: runId
  });
}