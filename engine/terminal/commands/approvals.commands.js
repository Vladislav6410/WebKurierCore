/**
 * Approvals terminal commands (MVP)
 *
 * Commands:
 * - /approvals list
 * - /approvals show <approvalId>
 * - /approvals approve <approvalId> [comment]
 * - /approvals reject <approvalId> [comment]
 *
 * Требование:
 * - runtime.store (SQLite runs)
 * - approvals API (engine/workflows/approvals.js) хранит approvals (пока in-memory)
 */

import { listApprovals, getApproval, resolveApproval } from "../../workflows/approvals.js";
import { runWorkflow } from "../../workflows/runner.js";
import { loadWorkflowFromFile } from "../../workflows/load.js";
import { createAuditEmitter } from "../../workflows/audit.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MVP: фиксированный workflow файл (потом заменим на registry)
const DEFAULT_WORKFLOW_FILE = path.join(
  __dirname,
  "..",
  "..",
  "workflows",
  "examples",
  "slack_ai_summary.workflow.json"
);

function fmtApproval(a) {
  return [
    `approvalId: ${a.approvalId}`,
    `runId:      ${a.runId}`,
    `stepId:     ${a.stepId}`,
    `status:     ${a.status}`,
    a.title ? `title:     ${a.title}` : null,
    a.message ? `message:   ${a.message}` : null,
    a.createdAt ? `created:   ${a.createdAt}` : null,
    a.decidedAt ? `decided:   ${a.decidedAt}` : null
  ].filter(Boolean).join("\n");
}

export function registerApprovalsCommands(terminal, runtime) {
  const emitAudit = createAuditEmitter({ terminal });

  // helper output
  const out = (text) => {
    if (terminal?.print) return terminal.print(text);
    // fallback
    // eslint-disable-next-line no-console
    console.log(text);
  };

  terminal.registerCommand("/approvals", async (argsLine = "") => {
    const args = String(argsLine).trim().split(/\s+/).filter(Boolean);
    const sub = (args[0] || "help").toLowerCase();

    if (sub === "help") {
      out(
        [
          "Approvals commands:",
          "  /approvals list",
          "  /approvals show <approvalId>",
          "  /approvals approve <approvalId> [comment]",
          "  /approvals reject <approvalId> [comment]"
        ].join("\n")
      );
      return;
    }

    if (sub === "list") {
      const items = listApprovals().filter(x => x.status === "pending");
      if (!items.length) {
        out("No pending approvals.");
        return;
      }
      out(
        items
          .map((a, i) => `${i + 1}) ${a.approvalId} | run=${a.runId} | step=${a.stepId} | ${a.title || ""}`)
          .join("\n")
      );
      return;
    }

    if (sub === "show") {
      const id = args[1];
      if (!id) {
        out("Usage: /approvals show <approvalId>");
        return;
      }
      const a = getApproval(id);
      if (!a) {
        out("Approval not found.");
        return;
      }
      out(fmtApproval(a));
      return;
    }

    if (sub === "approve" || sub === "reject") {
      const id = args[1];
      const comment = args.slice(2).join(" ");
      if (!id) {
        out(`Usage: /approvals ${sub} <approvalId> [comment]`);
        return;
      }

      const decision = sub === "approve" ? "approve" : "reject";
      const a = resolveApproval(id, decision, comment);

      // reject -> mark run failed and stop
      if (decision === "reject") {
        const run = runtime.store.getRun(a.runId);
        if (run) {
          runtime.store.updateRun(a.runId, {
            status: "failed",
            finishedAt: new Date().toISOString(),
            error: `Rejected by human: ${a.approvalId}`
          });
        }
        out(`Rejected: ${a.approvalId}`);
        return;
      }

      // approve -> resume workflow
      const run = runtime.store.getRun(a.runId);
      if (!run) {
        out("Run not found in store. (If server restarted, ensure SQLite store is enabled and same dbPath is used.)");
        return;
      }

      const { workflow } = loadWorkflowFromFile(DEFAULT_WORKFLOW_FILE);

      const resumed = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input: run.input,
        emitAudit,
        resumeFromRunId: run.id
      });

      out(`Approved: ${a.approvalId}`);
      out(`Run status: ${resumed.status}`);
      return;
    }

    out("Unknown subcommand. Type: /approvals help");
  });
}