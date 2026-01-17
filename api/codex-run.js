// api/codex-run.js
// Backend endpoint: POST /api/codex/run
//
// Express-compatible router.
//
// MVP:
// - server-side CodexAgent runner
// - safe tools: list_dir/read_file/glob/rg/apply_patch
// - security gates on apply_patch
// - local Chain-audit hook (JSONL with hashes) via api/chain-audit.js
//
// ENV:
// - OPENAI_API_KEY (required)
// - OPENAI_CODEX_MODEL (optional, default: gpt-5.2-codex)

import express from "express";

import { createOpenAIClient } from "./openai-client.js";
import { createCodexAgent } from "../engine/agents/codex/codex-agent.js";

import { createRepoAdapter } from "../engine/agents/codex/tools-repo-adapter.js";
import { validatePatchRequest } from "../engine/agents/codex/policy/security-gates.js";

import { auditEvent } from "./chain-audit.js";

function jsonError(res, status, message) {
  return res.status(status).json({ ok: false, error: String(message || "error") });
}

// best-effort: parse "+++ b/<file>" / "--- a/<file>" lines to collect touched files
function extractTouchedFilesFromPatch(patchText) {
  const files = new Set();
  const lines = String(patchText || "").split("\n");
  for (const line of lines) {
    if (line.startsWith("+++ ")) {
      const p = line.slice(4).trim();
      if (p.startsWith("b/")) files.add(p.slice(2));
      else if (p !== "/dev/null") files.add(p);
    }
    if (line.startsWith("--- ")) {
      const p = line.slice(4).trim();
      if (p.startsWith("a/")) files.add(p.slice(2));
      else if (p !== "/dev/null") files.add(p);
    }
  }
  return Array.from(files);
}

export function registerCodexRunRoute(app, opts = {}) {
  const router = express.Router();

  const repoRoot = opts.repoRoot || process.cwd();
  const promptFile = opts.promptFile || "engine/agents/codex/codex-prompt.md";

  router.post("/run", async (req, res) => {
    try {
      const { taskText = "", sessionId = null, reasoning = "medium" } = req.body || {};

      if (!taskText || typeof taskText !== "string") {
        return jsonError(res, 400, "taskText is required");
      }

      if (!process.env.OPENAI_API_KEY) {
        return jsonError(res, 500, "OPENAI_API_KEY is not set on server");
      }

      // --- OpenAI client (server-side) ---
      const openaiClient = createOpenAIClient({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // --- Repo adapter (server-side FS) ---
      const repo = createRepoAdapter({ repoRoot });

      // --- Tools impl (Codex tools) ---
      const toolsImpl = {
        async list_dir({ path: p, maxDepth = 2 }) {
          const out = await repo.listDir(p, { maxDepth });
          await auditEvent({
            actor: "engineer/codex",
            tool_name: "list_dir",
            args: { path: p, maxDepth },
            file_paths: [],
            session_id: sessionId,
            summary: `list_dir ${p}`,
          });
          return out;
        },

        async read_file({ path: p, maxChars = 200000 }) {
          const out = await repo.readFile(p, { maxChars });
          await auditEvent({
            actor: "engineer/codex",
            tool_name: "read_file",
            args: { path: p, maxChars },
            file_paths: [p],
            session_id: sessionId,
            summary: `read_file ${p}`,
          });
          return out;
        },

        async glob_file_search({ pattern, root = ".", maxResults = 200 }) {
          const out = await repo.glob(pattern, { root, maxResults });
          await auditEvent({
            actor: "engineer/codex",
            tool_name: "glob_file_search",
            args: { pattern, root, maxResults },
            file_paths: [],
            session_id: sessionId,
            summary: `glob_file_search ${pattern} in ${root}`,
          });
          return out;
        },

        async rg_search({ query, root = ".", maxResults = 200 }) {
          const out = await repo.rg(query, { root, maxResults });
          await auditEvent({
            actor: "engineer/codex",
            tool_name: "rg_search",
            args: { query, root, maxResults },
            file_paths: [],
            session_id: sessionId,
            summary: `rg_search "${query}" in ${root}`,
          });
          return out;
        },

        async apply_patch({ patch_text }) {
          const touched = extractTouchedFilesFromPatch(patch_text);

          // --- security gates ---
          const gate = validatePatchRequest(
            { filesTouched: touched, patchText: patch_text },
            {
              allowlist: ["engine/", "api/", "server/", "frontend/"],
              denylist: ["engine/config/secrets.json", ".env"],
            }
          );

          if (!gate?.ok) {
            await auditEvent({
              actor: "engineer/codex",
              tool_name: "apply_patch_blocked",
              args: { reason: gate?.reason || "blocked" },
              file_paths: touched,
              patch_text,
              session_id: sessionId,
              summary: `apply_patch BLOCKED: ${gate?.reason || "blocked"}`,
            });
            return { ok: false, error: `SecurityGate blocked patch: ${gate?.reason || "blocked"}` };
          }

          const out = await repo.applyPatch(patch_text);

          await auditEvent({
            actor: "engineer/codex",
            tool_name: "apply_patch",
            args: { ok: true },
            file_paths: touched,
            patch_text,
            session_id: sessionId,
            summary: `apply_patch OK (${touched.length} files)`,
          });

          return out;
        },
      };

      // --- CodexAgent ---
      const codexAgent = createCodexAgent({
        openaiClient,
        toolsImpl,
        promptFile,
      });

      const out = await codexAgent.runTask({
        taskText,
        reasoning,
        sessionState: null,
      });

      return res.json({
        ok: true,
        output_text: out.output_text || "",
        sessionId: sessionId || null,
        trace: out.trace || null,
      });
    } catch (e) {
      return jsonError(res, 500, e?.message || e);
    }
  });

  // итоговый URL: POST /api/codex/run
  app.use("/api/codex", router);
}