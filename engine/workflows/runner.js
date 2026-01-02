import crypto from "crypto";

function nowISO() {
  return new Date().toISOString();
}
function runId() {
  return crypto.randomUUID();
}

export async function runWorkflow({ workflow, registry, store, input, emitAudit }) {
  const id = runId();

  const run = store.createRun({
    id,
    workflowId: workflow.id,
    status: "running",
    startedAt: nowISO(),
    finishedAt: null,
    input,
    stepResults: {},
    currentStep: null,
    error: null
  });

  await emitAudit?.({ type: "run.started", runId: id, workflowId: workflow.id, ts: nowISO() });

  // adjacency
  const nextMap = new Map();
  for (const e of workflow.edges) {
    if (!nextMap.has(e.from)) nextMap.set(e.from, []);
    nextMap.get(e.from).push(e);
  }

  const startEdges = nextMap.get("start") || [];
  if (startEdges.length === 0) {
    const err = new Error("No start edge (from: 'start')");
    store.updateRun(id, { status: "failed", finishedAt: nowISO(), error: err.message });
    await emitAudit?.({ type: "run.failed", runId: id, workflowId: workflow.id, ts: nowISO(), error: err.message });
    throw err;
  }

  let queue = startEdges.map(e => e.to);

  try {
    while (queue.length) {
      const stepId = queue.shift();
      const stepDef = workflow.steps.find(s => s.id === stepId);
      if (!stepDef) throw new Error(`Step not found: ${stepId}`);

      store.updateRun(id, { currentStep: stepId });
      await emitAudit?.({ type: "step.started", runId: id, stepId, ts: nowISO() });

      const impl = registry.getStep(stepDef.type);

      const ctx = {
        runId: id,
        workflow,
        input,
        results: store.getRun(id).stepResults
      };

      const result = await impl.execute(stepDef.config, ctx);

      const stepResults = { ...store.getRun(id).stepResults, [stepId]: result };
      store.updateRun(id, { stepResults });

      await emitAudit?.({ type: "step.finished", runId: id, stepId, ts: nowISO(), ok: true });

      const edges = nextMap.get(stepId) || [];
      for (const e of edges) {
        if (!e.condition) {
          queue.push(e.to);
        } else {
          const condFn = new Function("input", "results", `return (${e.condition});`);
          const pass = !!condFn(input, stepResults);
          if (pass) queue.push(e.to);
        }
      }
    }

    store.updateRun(id, { status: "finished", finishedAt: nowISO(), currentStep: null });
    await emitAudit?.({ type: "run.finished", runId: id, workflowId: workflow.id, ts: nowISO() });

    return store.getRun(id);
  } catch (err) {
    store.updateRun(id, { status: "failed", finishedAt: nowISO(), currentStep: null, error: String(err?.message || err) });
    await emitAudit?.({ type: "run.failed", runId: id, workflowId: workflow.id, ts: nowISO(), error: String(err?.message ||