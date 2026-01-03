/**
 * /workflow command (MVP)
 *
 * Commands:
 * - /workflow help
 * - /workflow run <workflowFile> [--input <jsonFile>]
 * - /workflow list
 * - /workflow show <runId>
 *
 * Uses shared runtime (registry + SQLite store).
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
  // поддержка относительных путей от корня репо
  // если путь уже абсолютный — оставляем
  if (!p) return null;
  if (path.isAbsolute(p)) return p;

  // repo root относительно этого файла:
  // WebKurierCore/engine/terminal/commands/workflow.js -> ../../..
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
          "  /workflow show <runId>",
          "",
          "Examples:",
          "  /workflow run engine/workflows/examples/slack_ai_summary.workflow.json",
          "  /workflow run engine/workflows/examples/slack_ai_summary.workflow.json --input engine/workflows/examples/sample.input.json",
          "  /workflow list",
          "  /workflow show <runId>"
        ].join("\n")
      );
      return;
    }

    if (!runtime?.registry || !runtime?.store) {
      out(terminal, "Runtime not provided. registerWorkflowCommand(terminal, runtime) is required.");
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
            const line1 = `${i + 1}) ${r.id} | ${r.status} | wf=${r.workflowId}`;
            const line2 = `   started=${r.startedAt}${r.finishedAt ? ` | finished=${r.finishedAt}` : ""}`;
            const line3 = r.currentStep ? `   currentStep=${r.currentStep}` : "";
            const line4 = r.error ? `   error=${r.error}` : "";
            return [line1, line2, line3, line4].filter(Boolean).join("\n");
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

      // parse optional --input
      let input = {};
      const inputIdx = args.findIndex(x => x === "--input");
      if (inputIdx !== -1) {
        const inputFile = args[inputIdx + 1];
        if (!inputFile) {
          out(terminal, "Error: --input требует путь к json файлу");
          return;
        }
        input = readJsonFile(inputFile);
      }

      // load workflow
      const absWf = resolvePath(workflowFile);
      const { workflow } = loadWorkflowFromFile(absWf);

      out(terminal, `Running workflow: ${workflow.name} (${workflow.id})`);

      const run = await runWorkflow({
        workflow,
        registry: runtime.registry,
        store: runtime.store,
        input,
        emitAudit
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
