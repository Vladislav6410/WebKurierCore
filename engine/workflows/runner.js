import crypto from "crypto";
import { sanitizeInputPayload } from "./securityGate.js";

function nowISO() {
  return new Date().toISOString();
}

function newRunId() {
  return crypto.randomUUID();
}

/**
 * runWorkflow
 *
 * Поддержка resume:
 * - если передан resumeFromRunId, то продолжает существующий run
 * - если resumeFromRunId не передан, создаёт новый run
 *
 * Правила:
 * - input санитизируется на границе (один раз)
 * - если шаг вернул {status:"pending"} -> run.status="waiting" и выходим
 * - при resume: уже выполненные шаги пропускаются (stepResults[stepId] существует и не pending)
 */
export async function runWorkflow({
  workflow,
  registry,
  store,
  input,
  emitAudit,
  resumeFromRunId = null
}) {
  const id = resumeFromRunId || newRunId();

  // ✅ sanitize input once, at the boundary
  const safeInput = sanitizeInputPayload(input, workflow.policies || {});

  // create or resume run
  let run = store.getRun(id);

  if (!run) {
    run = store.createRun({
      id,
      workflowId: workflow.id,
      status: "running", // running | waiting | finished | failed
      startedAt: nowISO(),
      finishedAt: null,
      input: safeInput,
      stepResults: {},
      currentStep: null,
      error: null
    });

    await emitAudit?.({
      type: "run.started",
      runId: id,
      workflowId: workflow.id,
      ts: nowISO()
    });
  } else {
    // resume existing run (keep existing input if present)
    const resumedInput = run.input ?? safeInput;
    store.updateRun(id, {
      status: "running",
      finishedAt: null,
      error: null,
      input: resumedInput
    });

    await emitAudit?.({
      type: "run.resumed",
      runId: id,
      workflowId: workflow.id,
      ts: nowISO()
    });
  }

  // adjacency map
  const nextMap = new Map();
  for (const e of workflow.edges) {
    if (!nextMap.has(e.from)) nextMap.set(e.from, []);
    nextMap.get(e.from).push(e);
  }

  const startEdges = nextMap.get("start") || [];
  if (startEdges.length === 0) {
    const err = new Error("No start edge (from: 'start')");
    store.updateRun(id, { status: "failed", finishedAt: nowISO(), error: err.message });

    await emitAudit?.({
      type: "run.failed",
      runId: id,
      workflowId: workflow.id,
      ts: nowISO(),
      error: err.message
    });

    throw err;
  }

  // start queue
  let queue = startEdges.map(e => e.to);

  try {
    while (queue.length) {
      const stepId = queue.shift();
      const stepDef = workflow.steps.find(s => s.id === stepId);
      if (!stepDef) throw new Error(`Step not found: ${stepId}`);

      // ✅ skip if already done (and not pending)
      const existing = store.getRun(id)?.stepResults?.[stepId];
      if (existing && existing.status !== "pending") {
        await emitAudit?.({
          type: "step.skipped",
          runId: id,
          stepId,
          ts: nowISO()
        });

        // даже если пропустили — всё равно идём по edges
        const edges = nextMap.get(stepId) || [];
        for (const e of edges) {
          if (!e.condition) {
            queue.push(e.to);
          } else {
            const condFn = new Function("input", "results", `return (${e.condition});`);
            const pass = !!condFn(store.getRun(id).input, store.getRun(id).stepResults);
            if (pass) queue.push(e.to);
          }
        }
        continue;
      }

      store.updateRun(id, { currentStep: stepId });

      await emitAudit?.({
        type: "step.started",
        runId: id,
        stepId,
        ts: nowISO()
      });

      const impl = registry.getStep(stepDef.type);

      const ctx = {
        runId: id,
        workflow,
        input: store.getRun(id).input, // ✅ current stored input
        results: store.getRun(id).stepResults
      };

      const result = await impl.execute(stepDef.config, ctx);

      // ✅ pending approval -> STOP workflow
      if (result?.status === "pending") {
        const stepResults = { ...store.getRun(id).stepResults, [stepId]: result };

        store.updateRun(id, {
          status: "waiting",
          currentStep: stepId,
          stepResults
        });

        await emitAudit?.({
          type: "human.approval.requested",
          runId: id,
          stepId,
          approvalId: result.approvalId,
          ts: nowISO()
        });

        return store.getRun(id);
      }

      // normal step save
      const stepResults = { ...store.getRun(id).stepResults, [stepId]: result };
      store.updateRun(id, { stepResults });

      await emitAudit?.({
        type: "step.finished",
        runId: id,
        stepId,
        ts: nowISO(),
        ok: true
      });

      // next edges
      const edges = nextMap.get(stepId) || [];
      for (const e of edges) {
        if (!e.condition) {
          queue.push(e.to);
        } else {
          const condFn = new Function("input", "results", `return (${e.condition});`);
          const pass = !!condFn(store.getRun(id).input, stepResults);
          if (pass) queue.push(e.to);
        }
      }
    }

    store.updateRun(id, { status: "finished", finishedAt: nowISO(), currentStep: null });

    await emitAudit?.({
      type: "run.finished",
      runId: id,
      workflowId: workflow.id,
      ts: nowISO()
    });

    return store.getRun(id);
  } catch (err) {
    const msg = String(err?.message || err);

    store.updateRun(id, {
      status: "failed",
      finishedAt: nowISO(),
      currentStep: null,
      error: msg
    });

    await emitAudit?.({
      type: "run.failed",
      runId: id,
      workflowId: workflow.id,
      ts: nowISO(),
      error: msg
    });

    throw err;
  }
}
