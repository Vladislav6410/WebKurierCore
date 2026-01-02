import { runWorkflow } from "../../workflows/runner.js";
import { createWorkflowRuntime } from "../../workflows/index.js";
import { loadWorkflowFromFile } from "../../workflows/load.js";

/**
 * Терминальная команда:
 * /workflow run engine/workflows/examples/slack_ai_summary.workflow.json
 * /workflow list
 * /workflow show <runId>
 */
export function registerWorkflowCommand(terminal) {
  const runtime = createWorkflowRuntime(); // registry + store

  async function emitAudit(event) {
    // MVP: просто печатаем. Потом подключим Chain.
    terminal.print?.(`[audit] ${JSON.stringify(event)}`);
  }

  terminal.registerCommand?.("workflow", async (args = []) => {
    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") {
      terminal.print?.(
        [
          "Usage:",
          "  /workflow run <path-to-workflow.json>",
          "  /workflow list",
          "  /workflow show <runId>"
        ].join("\n")
      );
      return;
    }

    if (sub === "run") {
      const filePath = args[1];
      if (!filePath) {
        terminal.print?.("Error: provide path to workflow JSON");
        return;
      }

      const { workflow, resolvedPath } = loadWorkflowFromFile(filePath);
      terminal.print?.(`Loaded: ${resolvedPath}`);
      terminal.print?.(`Running workflow: ${workflow.id} — ${workflow.name}`);

      const input = {}; // MVP: пустой input. Потом сделаем /workflow run <file> --input '{...}'
      const run = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input,
        emitAudit
      });

      terminal.print?.(`Run finished: ${run.id} (status=${run.status})`);
      terminal.print?.(`Results:\n${JSON.stringify(run.stepResults, null, 2)}`);
      return;
    }

    if (sub === "list") {
      const runs = runtime.store.listRuns?.(20) || [];
      if (!runs.length) {
        terminal.print?.("No runs yet.");
        return;
      }
      terminal.print?.(
        runs
          .map(r => `${r.id} | ${r.status} | ${r.workflowId} | ${r.startedAt}`)
          .join("\n")
      );
      return;
    }

    if (sub === "show") {
      const runId = args[1];
      if (!runId) {
        terminal.print?.("Error: provide runId");
        return;
      }
      const run = runtime.store.getRun?.(runId);
      if (!run) {
        terminal.print?.(`Run not found: ${runId}`);
        return;
      }
      terminal.print?.(JSON.stringify(run, null, 2));
      return;
    }

    terminal.print?.(`Unknown subcommand: ${sub}. Try /workflow help`);
  });
}