import { runWorkflow } from "../../workflows/runner.js";
import { createWorkflowRuntime } from "../../workflows/index.js";
import { loadWorkflowFromFile } from "../../workflows/load.js";
import { validateWorkflow } from "../../workflows/validate.js";
import { createAuditEmitter } from "../../workflows/audit.js";

function parseArgs(rawArgs = []) {
  // Позволяет:
  // /workflow run <wf.json> --input <input.json>
  const args = [...rawArgs];
  const flags = {};
  const pos = [];

  while (args.length) {
    const a = args.shift();
    if (a === "--input") flags.input = args.shift();
    else pos.push(a);
  }
  return { pos, flags };
}

export function registerWorkflowCommand(terminal) {
  const runtime = createWorkflowRuntime(); // registry + store
  const emitAudit = createAuditEmitter({ terminal });

  terminal.registerCommand?.("workflow", async (rawArgs = []) => {
    const { pos, flags } = parseArgs(rawArgs);
    const sub = (pos[0] || "").toLowerCase();

    if (!sub || sub === "help") {
      terminal.print?.(
        [
          "Usage:",
          "  /workflow run <path-to-workflow.json> [--input <path-to-input.json>]",
          "  /workflow list",
          "  /workflow show <runId>",
          "",
          "Examples:",
          "  /workflow run engine/workflows/examples/transform_only.workflow.json",
          "  /workflow run engine/workflows/examples/slack_ai_summary.workflow.json --input engine/workflows/examples/sample.input.json"
        ].join("\n")
      );
      return;
    }

    if (sub === "run") {
      const wfPath = pos[1];
      if (!wfPath) {
        terminal.print?.("Error: provide path to workflow JSON");
        return;
      }

      const { workflow, resolvedPath } = loadWorkflowFromFile(wfPath);
      validateWorkflow(workflow);

      terminal.print?.(`Loaded workflow: ${resolvedPath}`);
      terminal.print?.(`Running: ${workflow.id} — ${workflow.name}`);

      let input = {};
      if (flags.input) {
        const loaded = loadWorkflowFromFile(flags.input); // re-use loader for json
        input = loaded.workflow; // это JSON объект
        terminal.print?.(`Loaded input: ${loaded.resolvedPath}`);
      }

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
      const runId = pos[1];
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
