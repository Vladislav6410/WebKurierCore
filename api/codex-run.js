// api/codex-run.js
// Backend endpoint: POST /api/codex/run
//
// Express-compatible router.
// MVP stage:
// - RepoAdapter (read/list/glob) is real now
// - rg + applyPatch are still stubs (next steps)
// - OpenAI wrapper is still a stub (next step)
//
// IMPORTANT:
// - Never expose OpenAI keys to browser/client.
// - Secrets must come from environment (injected via WebKurierHybrid CI/CD).

import express from "express";
import { createCodexAgent } from "../engine/agents/codex/codex-agent.js";
import { createRepoAdapter } from "./repo-adapter.js";

export function registerCodexRunRoute(app, opts = {}) {
  const {
    repoRoot = process.cwd(),
    promptFile = "engine/agents/codex/codex-prompt.md",
  } = opts;

  const router = express.Router();

  router.post("/run", async (req, res) => {
    try {
      const { taskText, sessionId = null } = req.body || {};
      if (!taskText) {
        return res.status(400).send("taskText is required");
      }

      // ✅ Repo adapter (now implemented: read/list/glob)
      const repo = createRepoAdapter({ repoRoot });

      // ✅ Tools impl (wire to repo adapter)
      const toolsImpl = {
        list_dir: async ({ path, maxDepth = 1 }) => {
          const entries = await repo.listDir(path, { maxDepth });
          return { ok: true, path, entries };
        },

        read_file: async ({ path, maxChars = 120000 }) => {
          const text = await repo.readText(path, { maxChars });
          return { ok: true, path, length: text.length, text };
        },

        glob_file_search: async ({ pattern, root = ".", maxResults = 100 }) => {
          const paths = await repo.glob(pattern, { root, maxResults });
          return { ok: true, pattern, root, count: paths.length, paths };
        },

        // ⛔ next step
        rg_search: async () => {
          throw new Error("rg_search not implemented yet (next file)");
        },

        // ⛔ next step
        apply_patch: async () => {
          throw new Error("apply_patch not implemented yet (next files)");
        },
      };

      // ⛔ OpenAI wrapper (next step)
      const openaiClient = createOpenAIWrapper();

      const agent = createCodexAgent({
        openaiClient,
        toolsImpl,
        promptFile,
      });

      const out = await agent.runTask({
        taskText,
        reasoning: "medium",
        sessionState: sessionId ? { id: sessionId, messages: [] } : null,
      });

      return res.json({
        output_text: out.output_text || "",
        sessionId: sessionId || null,
      });
    } catch (e) {
      return res.status(500).send(String(e?.message || e));
    }
  });

  app.use("/api/codex", router);
}

/* ------------------ MVP STUB: OpenAI Wrapper ------------------ */

function createOpenAIWrapper() {
  return {
    async run() {
      throw new Error("OpenAI wrapper not implemented (wire Responses API next)");
    },
  };
}