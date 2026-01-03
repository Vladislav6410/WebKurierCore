/**
 * WebKurierCore Approvals API (registry-fix)
 *
 * Endpoints:
 * - GET  /api/approvals
 * - GET  /api/approvals/:id
 * - POST /api/approvals/:id/approve
 * - POST /api/approvals/:id/reject
 *
 * Behavior:
 * - approve: resolves approval + resumes the ORIGINAL workflow (from run.meta.workflowFile)
 * - reject: resolves approval + marks run as failed
 */

import { resolveApproval, getApproval, listApprovals } from "../engine/workflows/approvals.js";
import { runWorkflow } from "../engine/workflows/runner.js";
import { loadWorkflowFromFile } from "../engine/workflows/load.js";
import { createAuditEmitter } from "../engine/workflows/audit.js";
import { resolveWorkflowFileForRun, createWorkflowRegistry } from "../engine/workflows/workflowRegistry.js";

export function registerApprovalRoutes(app, runtime) {
  const emitAudit = createAuditEmitter({});
  const wfRegistry = createWorkflowRegistry(); // fallback для старых runs

  // List approvals
  app.get("/api/approvals", (req, res) => {
    res.json(listApprovals());
  });

  // Get approval by id
  app.get("/api/approvals/:id", (req, res) => {
    const a = getApproval(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  // Approve + Resume ORIGINAL workflow
  app.post("/api/approvals/:id/approve", async (req, res) => {
    try {
      const approvalId = req.params.id;

      // 1) resolve approval
      const a = resolveApproval(approvalId, "approve", req.body?.comment || "");

      // 2) load run from shared runtime store
      const run = runtime.store.getRun(a.runId);
      if (!run) {
        return res.status(409).json({
          error: "Run not found. Ensure shared runtime + stable SQLite path.",
          approval: a
        });
      }

      // 3) resolve workflow file from run.meta
      const workflowFile = resolveWorkflowFileForRun(run, wfRegistry);
      if (!workflowFile) {
        return res.status(409).json({
          error: "workflowFile not found in run.meta. This run cannot be resumed.",
          approval: a,
          run
        });
      }

      // 4) load workflow definition
      const { workflow } = loadWorkflowFromFile(workflowFile);

      // 5) resume
      const resumed = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input: run.input,
        emitAudit,
        resumeFromRunId: run.id
      });

      res.json({ ok: true, approval: a, run: resumed });
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Reject + mark run failed
  app.post("/api/approvals/:id/reject", async (req, res) => {
    try {
      const approvalId = req.params.id;
      const a = resolveApproval(approvalId, "reject", req.body?.comment || "");

      const run = runtime.store.getRun(a.runId);
      if (run) {
        runtime.store.updateRun(a.runId, {
          status: "failed",
          finishedAt: new Date().toISOString(),
          error: `Rejected by human: ${a.approvalId}`
        });
      }

      res.json({ ok: true, approval: a, run: run || null });
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Optional compatibility endpoint
  app.get("/approvals/pending", (req, res) => {
    res.json(listApprovals().filter(x => x.status === "pending"));
  });
}
