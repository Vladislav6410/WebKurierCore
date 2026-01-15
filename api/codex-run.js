// api/codex-run.js
// Backend endpoint: POST /api/codex/run
//
// This is an Express-compatible router.
// It is designed as MVP scaffolding:
// - OpenAI wrapper is a stub (you wire your OpenAI Responses API call here)
// - Repo adapter is a stub (you wire read/list/rg/glob/patch apply here)
//
// IMPORTANT:
// - Never expose OpenAI keys to browser/client.
// - Secrets must come from environment (injected via WebKurierHybrid CI/CD).

import express from "express";
import { createCodexAgent } from "../engine/agents/codex/codex-agent.js";

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

      // ---- Repo adapter (MVP stub) ----
      // Replace these with real implementations.
      const repo = createRepoAdapter({ repoRoot });

      // ---- Tools impl (wired to repo adapter) ----
      const toolsImpl = {
        list_dir: async ({ path, maxDepth = 1 }) =>
          repo.listDir(path, { maxDepth }),

        read_file: async ({ path, maxChars = 120000 }) =>
          repo.readText(path, { maxChars }),

        glob_file_search: async ({ pattern, root = ".", maxResults = 100 }) =>
          repo.glob(pattern, { root, maxResults }),

        rg_search: async ({ query, root = ".", maxResults = 200 }) =>
          repo.rg(query, { root, maxResults }),

        apply_patch: async ({ patch_text }) =>
          repo.applyPatch(patch_text),
      };

      // ---- OpenAI client wrapper (MVP stub) ----
      // Wire OpenAI Responses API here.
      const openaiClient = createOpenAIWrapper();

      const agent = createCodexAgent({
        openaiClient,
        toolsImpl,
        promptFile,
      });

      const out = await agent.runTask({
        taskText,
        reasoning: "medium",
        // sessionState reserved for Chain compaction later
        sessionState: sessionId ? { id: sessionId, messages: [] } : null,
      });

      // In MVP, we just echo sessionId back (you can generate one later)
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

/* ------------------ MVP STUBS BELOW ------------------ */

function createRepoAdapter({ repoRoot }) {
  // TODO: Implement with fs + fast-glob + rg + patch apply.
  // For now, throw explicit errors so you see what to wire next.
  return {
    async readText() {
      throw new Error("RepoAdapter.readText not implemented");
    },
    async listDir() {
      throw new Error("RepoAdapter.listDir not implemented");
    },
    async glob() {
      throw new Error("RepoAdapter.glob not implemented");
    },
    async rg() {
      throw new Error("RepoAdapter.rg not implemented");
    },
    async applyPatch() {
      throw new Error("RepoAdapter.applyPatch not implemented");
    },
  };
}

function createOpenAIWrapper() {
  // TODO: Implement OpenAI Responses API call with tool calling.
  // Return shape: { output_text, trace? }
  return {
    async run() {
      throw new Error("OpenAI wrapper not implemented (wire Responses API here)");
    },
  };
}