import { createTaskRecord, loadTaskRecord, saveTaskRecord } from "./taskflow-store.js";
import { evaluateStepSecurity } from "./taskflow-guard.js";
import { routeTaskStep } from "./taskflow-router.js";
import { STEP_STATUS, TASK_STATUS } from "./taskflow-types.js";
import { createId, nowIso, safeError } from "./taskflow-utils.js";

async function appendAudit(task, event) {
  task.audit = task.audit || [];
  task.audit.push({
    id: createId("audit"),
    at: nowIso(),
    ...event
  });
}

function getNextRunnableStep(task) {
  return task.steps.find(step =>
    [STEP_STATUS.PENDING, STEP_STATUS.READY].includes(step.status)
  );
}

function normalizeTaskPayload(payload) {
  return {
    taskId: payload.taskId,
    flowName: payload.flowName || "unnamed-flow",
    status: payload.status || TASK_STATUS.PENDING,
    ownerAgent: payload.ownerAgent || "master",
    context: payload.context || {},
    metadata: payload.metadata || {},
    audit: payload.audit || [],
    steps: (payload.steps || []).map((step, index) => ({
      stepId: step.stepId || createId(`step${index + 1}`),
      title: step.title || `Step ${index + 1}`,
      domain: step.domain || "core",
      action: step.action || "noop",
      input: step.input || {},
      status: step.status || STEP_STATUS.PENDING,
      trustLevel: step.trustLevel || "untrusted",
      requiresSecrets: Boolean(step.requiresSecrets),
      output: step.output || null,
      error: step.error || null,
      startedAt: step.startedAt || null,
      finishedAt: step.finishedAt || null
    }))
  };
}

export async function createTaskFlow(payload) {
  const normalized = normalizeTaskPayload(payload);
  await appendAudit(normalized, {
    type: "task.created",
    message: `Task ${normalized.flowName} created`
  });

  return createTaskRecord(normalized);
}

export async function runTaskFlow(taskId) {
  const task = await loadTaskRecord(taskId);

  if ([TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED].includes(task.status)) {
    return task;
  }

  task.status = TASK_STATUS.RUNNING;
  await appendAudit(task, {
    type: "task.started",
    message: `Task ${task.flowName} started`
  });

  while (true) {
    const step = getNextRunnableStep(task);
    if (!step) {
      task.status = TASK_STATUS.COMPLETED;
      await appendAudit(task, {
        type: "task.completed",
        message: `Task ${task.flowName} completed`
      });
      await saveTaskRecord(task);
      return task;
    }

    step.status = STEP_STATUS.RUNNING;
    step.startedAt = nowIso();
    await appendAudit(task, {
      type: "step.started",
      stepId: step.stepId,
      message: `${step.title} started`
    });

    const securityDecision = await evaluateStepSecurity(task, step);
    if (!securityDecision.allow) {
      step.status = STEP_STATUS.BLOCKED;
      step.finishedAt = nowIso();
      step.error = {
        code: "SECURITY_BLOCKED",
        message: securityDecision.reason,
        riskLevel: securityDecision.riskLevel
      };

      task.status = TASK_STATUS.FAILED;
      await appendAudit(task, {
        type: "step.blocked",
        stepId: step.stepId,
        message: securityDecision.reason
      });

      await saveTaskRecord(task);
      return task;
    }

    try {
      const output = await routeTaskStep(step, {
        taskId: task.taskId,
        flowName: task.flowName,
        taskContext: task.context
      });

      step.output = output;
      step.status = STEP_STATUS.COMPLETED;
      step.finishedAt = nowIso();

      await appendAudit(task, {
        type: "step.completed",
        stepId: step.stepId,
        message: `${step.title} completed`
      });

      await saveTaskRecord(task);
    } catch (error) {
      step.status = STEP_STATUS.FAILED;
      step.error = safeError(error);
      step.finishedAt = nowIso();
      task.status = TASK_STATUS.FAILED;

      await appendAudit(task, {
        type: "step.failed",
        stepId: step.stepId,
        message: error?.message || "Step failed"
      });

      await saveTaskRecord(task);
      return task;
    }
  }
}

export async function pauseTaskFlow(taskId) {
  const task = await loadTaskRecord(taskId);
  task.status = TASK_STATUS.PAUSED;

  await appendAudit(task, {
    type: "task.paused",
    message: `Task ${task.flowName} paused`
  });

  return saveTaskRecord(task);
}

export async function resumeTaskFlow(taskId) {
  const task = await loadTaskRecord(taskId);

  if (task.status !== TASK_STATUS.PAUSED) {
    return task;
  }

  task.status = TASK_STATUS.RUNNING;

  await appendAudit(task, {
    type: "task.resumed",
    message: `Task ${task.flowName} resumed`
  });

  await saveTaskRecord(task);
  return runTaskFlow(taskId);
}