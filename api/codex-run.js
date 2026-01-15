// api/codex-run.js
// Backend endpoint: POST /api/codex/run
//
// Express-compatible router.
// MVP stage:
// ✅ RepoAdapter (read/list/glob) implemented
// ✅ rg_search implemented (system ripgrep)
// ✅ OpenAI wrapper implemented (Responses API + tool-calls loop)
// ⛔ apply_patch will be implemented next
//
// IMPORTANT:
// - Never expose OpenAI keys to browser/client.
// - Env OPENAI_API_KEY must be set server-side (via WebKurierHybrid secrets).

import express from "express";
import { createCodexAgent } from "../engine/agents/codex/codex-agent.js";
import { createRepoAdapter } from "./repo-adapter.js";
import { createRgAdapter } from "./rg-adapter.js";
import { createOpenAIWrapper } from "./openai-wrapper.js";

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

      // ✅ Adapters
      const repo = createRepoAdapter({ repoRoot });
      const rg = createRgAdapter({ repoRoot });

      // ✅ Tools impl
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

        rg_search: async ({ query, root = ".", maxResults = 200 }) => {
          const matches = await rg.rg(query, { root, maxResults });
          return { ok: true, query, root, count: matches.length, matches };
        },

        // ⛔ Next: implement apply_patch (plus previewPatch + security gates)
        apply_patch: async () => {
          throw new Error("apply_patch not implemented yet (next files)");
        },
      };

      // ✅ OpenAI wrapper
      const openaiClient = createOpenAIWrapper({
        maxIterations: 12,
        parallelToolCalls: true,
      });

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
        trace: out.trace || null,
      });
    } catch (e) {
      return res.status(500).send(String(e?.message || e));
    }
  });

  app.use("/api/codex", router);
}