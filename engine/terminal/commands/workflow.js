/**
 * /workflow command (with registry-fix)
 *
 * Commands:
 * - /workflow help
 * - /workflow run <workflowFile> [--input <jsonFile>]
 * - /workflow list
 * - /workflow show <runId>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { runWorkflow } from "../../workflows/runner.js";
import { loadWorkflowFromFile } from "../../workflows/load.js";
import { createAuditEmitter } from "../../workflows/audit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function out(terminal, msg) {
  if (terminal?.print) terminal.print(msg);
  else console.log(msg);
}

function resolvePath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;

  // repo root: WebKurierCore/
  const repoRoot = path.join(__dirname, "..", "..", "..");
  return path.join(repoRoot, p);
}

function readJsonFile(filePath) {
  const abs = resolvePath(filePath);
  const raw = fs.readFileSync(abs, "utf-8");
  return JSON.parse(raw);
}

export function registerWorkflowCommand(terminal, runtime) {
  const emitAudit = createAuditEmitter({ terminal });

  terminal.registerCommand("/workflow", async (argsLine = "") => {
    const args = String(argsLine).trim().split(/\s+/).filter(Boolean);
    const sub = (args[0] || "help").toLowerCase();

    if (sub === "help") {
      out(
        terminal,
        [
          "Workflow commands:",
          "  /workflow run <workflowFile> [--input <jsonFile>]",
          "  /workflow list",
          "  /workflow show <runId>"
        ].join("\n")
      );
      return;
    }

    if (!runtime?.registry || !runtime?.store) {
      out(terminal, "Runtime not available.");
      return;
    }

    if (sub === "list") {
      const runs = runtime.store.listRuns(50);
      if (!runs.length) {
        out(terminal, "No runs.");
        return;
      }
      out(
        terminal,
        runs
          .map((r, i) => {
            return [
              `${i + 1}) ${r.id} | ${r.status} | wf=${r.workflowId}`,
              `   started=${r.startedAt}${r.finishedAt ? ` | finished=${r.finishedAt}` : ""}`,
              r.currentStep ? `   currentStep=${r.currentStep}` : "",
              r.meta?.workflowFile ? `   workflowFile=${r.meta.workflowFile}` : ""
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n")
      );
      return;
    }

    if (sub === "show") {
      const runId = args[1];
      if (!runId) {
        out(terminal, "Usage: /workflow show <runId>");
        return;
      }
      const run = runtime.store.getRun(runId);
      if (!run) {
        out(terminal, "Run not found.");
        return;
      }
      out(terminal, run);
      return;
    }

    if (sub === "run") {
      const workflowFile = args[1];
      if (!workflowFile) {
        out(terminal, "Usage: /workflow run <workflowFile> [--input <jsonFile>]");
        return;
      }

      // parse --input
      let input = {};
      const inputIdx = args.findIndex(x => x === "--input");
      if (inputIdx !== -1) {
        const inputFile = args[inputIdx + 1];
        if (!inputFile) {
          out(terminal, "Error: --input requires json file path");
          return;
        }
        input = readJsonFile(inputFile);
      }

      const absWorkflowFile = resolvePath(workflowFile);
      const { workflow } = loadWorkflowFromFile(absWorkflowFile);

      out(terminal, `Running workflow: ${workflow.name} (${workflow.id})`);

      // 🔁 run workflow
      const run = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input,
        emitAudit
      });

      // ✅ registry-fix: store workflowFile in run.meta
      runtime.store.updateRun(run.id, {
        meta: {
          workflowFile: absWorkflowFile
        }
      });

      out(terminal, `Run created: ${run.id}`);
      out(terminal, `Status: ${run.status}`);
      if (run.status === "waiting") {
        out(terminal, "Waiting for approval. Use: /approvals list");
      }
      return;
    }

    out(terminal, "Unknown subcommand. Type: /workflow help");
  });
}
