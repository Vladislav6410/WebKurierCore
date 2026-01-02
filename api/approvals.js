import path from "path";
import { fileURLToPath } from "url";

import { resolveApproval, getApproval, listApprovals } from "../engine/workflows/approvals.js";
import { runWorkflow } from "../engine/workflows/runner.js";
import { loadWorkflowFromFile } from "../engine/workflows/load.js";
import { createAuditEmitter } from "../engine/workflows/audit.js";

// ✅ фиксируем абсолютный путь, чтобы не ломалось от cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_WORKFLOW_FILE = path.join(__dirname, "..", "engine", "workflows", "examples", "slack_ai_summary.workflow.json");

/**
 * registerApprovalRoutes(app, runtime)
 * runtime = createWorkflowRuntime({ dbPath: "data/workflows.sqlite" })
 */
export function registerApprovalRoutes(app, runtime) {
  const emitAudit = createAuditEmitter({});

  // ✅ canonical API
  app.get("/api/approvals", (req, res) => {
    res.json(listApprovals());
  });

  app.get("/api/approvals/:id", (req, res) => {
    const a = getApproval(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  app.post("/api/approvals/:id/approve", async (req, res) => {
    try {
      const approvalId = req.params.id;

      // 1) resolve approval
      const a = resolveApproval(approvalId, "approve", req.body?.comment || "");

      // 2) load workflow
      const { workflow } = loadWorkflowFromFile(DEFAULT_WORKFLOW_FILE);

      // 3) find run in SAME runtime store
      const run = runtime.store.getRun(a.runId);
      if (!run) {
        return res.status(409).json({
          error: "Run not found in store. Check that server uses ONE shared runtime and SQLite path is stable.",
          approval: a
        });
      }

      // 4) resume
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

  // ✅ OPTIONAL compatibility (если хочешь поддержать “старые” примеры)
  app.get("/approvals/pending", (req, res) => {
    const items = listApprovals().filter(x => x.status === "pending");
    res.json(items);
  });
}
