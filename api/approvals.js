/**
 * WebKurierCore Approvals API (MVP)
 *
 * Endpoints:
 * - GET  /api/approvals
 * - GET  /api/approvals/:id
 * - POST /api/approvals/:id/approve
 * - POST /api/approvals/:id/reject
 *
 * Behavior:
 * - approve: resolves approval + resumes workflow run until finished/waiting
 * - reject: resolves approval + marks run as failed
 *
 * IMPORTANT:
 * - This module expects an Express app with app.use(express.json())
 * - Workflow loading strategy (MVP): load by fixed file path
 *   Later: implement registry mapping workflowId -> file
 */

import { resolveApproval, getApproval, listApprovals } from "../engine/workflows/approvals.js";
import { runWorkflow } from "../engine/workflows/runner.js";
import { createWorkflowRuntime } from "../engine/workflows/index.js";
import { loadWorkflowFromFile } from "../engine/workflows/load.js";
import { createAuditEmitter } from "../engine/workflows/audit.js";

// ✅ MVP: фиксированный путь к workflow-файлу
// Позже заменим на реестр: workflowId -> filePath
const DEFAULT_WORKFLOW_FILE = "engine/workflows/examples/slack_ai_summary.workflow.json";

export function registerApprovalRoutes(app) {
  const runtime = createWorkflowRuntime();
  const emitAudit = createAuditEmitter({}); // пишет в console, если terminal не передан

  // List all approvals
  app.get("/api/approvals", (req, res) => {
    res.json(listApprovals());
  });

  // Get approval by id
  app.get("/api/approvals/:id", (req, res) => {
    const a = getApproval(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  // Approve + Resume workflow
  app.post("/api/approvals/:id/approve", async (req, res) => {
    try {
      const approvalId = req.params.id;

      // 1) Resolve approval
      const a = resolveApproval(approvalId, "approve", req.body?.comment || "");

      // 2) Load workflow definition
      const { workflow } = loadWorkflowFromFile(DEFAULT_WORKFLOW_FILE);

      // 3) Find run and resume it
      const run = runtime.store.getRun(a.runId);
      if (!run) {
        // Если run store в памяти — он может быть пустой при перезапуске сервера
        // Тогда невозможно продолжить без DB. Честно сообщаем.
        return res.status(409).json({
          error: "Run not found in store (server restart?). Use persistent store to resume.",
          approval: a
        });
      }

      // 4) Resume: продолжить тот же runId
      // runner пропустит уже выполненные шаги и пойдёт дальше
      const resumed = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input: run.input,
        emitAudit,
        resumeFromRunId: run.id
      });

      res.json({
        ok: true,
        approval: a,
        run: resumed
      });
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Reject + mark run failed
  app.post("/api/approvals/:id/reject", async (req, res) => {
    try {
      const approvalId = req.params.id;

      // 1) Resolve approval
      const a = resolveApproval(approvalId, "reject", req.body?.comment || "");

      // 2) Mark run failed in store (if exists)
      const run = runtime.store.getRun(a.runId);
      if (run) {
        runtime.store.updateRun(a.runId, {
          status: "failed",
          finishedAt: new Date().toISOString(),
          error: `Rejected by human: ${a.approvalId}`
        });
      }

      res.json({
        ok: true,
        approval: a,
        run: run || null
      });
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
