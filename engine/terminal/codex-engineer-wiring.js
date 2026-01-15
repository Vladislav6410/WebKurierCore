// engine/terminal/codex-engineer-wiring.js
// Wiring layer: Terminal -> EngineerAgent -> Codex bridge (MVP)
//
// This file does NOT modify your existing terminal_agent.js automatically.
// It provides ONE function you call during terminal bootstrap,
// right after EngineerAgent is created/available.

import { registerEngineerCodexBridge } from "../agents/engineer/codex-bridge.js";

/**
 * Wire Engineer Codex-mode into the running EngineerAgent.
 *
 * @param {object} params
 * @param {object} params.engineerAgent - instance of EngineerAgent
 * @param {function} params.fetchFn - fetch implementation (browser fetch or node-fetch wrapper)
 *
 * How it calls backend:
 *  POST /api/codex/run  { taskText, sessionId }
 *
 * Expected response:
 *  { output_text, sessionId? }
 */
export function wireEngineerCodexMode({ engineerAgent, fetchFn = null }) {
  if (!engineerAgent) {
    throw new Error("wireEngineerCodexMode: engineerAgent is required");
  }

  const fetchImpl = fetchFn || (typeof fetch !== "undefined" ? fetch : null);
  if (!fetchImpl) {
    throw new Error("wireEngineerCodexMode: fetchFn is required in this environment");
  }

  registerEngineerCodexBridge(engineerAgent, {
    codexService: {
      run: async ({ taskText, sessionId = null }) => {
        const r = await fetchImpl("/api/codex/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskText, sessionId }),
        });

        if (!r.ok) {
          const t = await r.text();
          return { output_text: `Codex error: ${t}` };
        }

        // { output_text, sessionId? }
        return await r.json();
      },
    },

    getPromptInfo: () => "Prompt file: engine/agents/codex/codex-prompt.md",

    getToolsInfo: () =>
      [
        "Tools (MVP):",
        "- list_dir(path)",
        "- read_file(path)",
        "- glob_file_search(pattern, root?)",
        "- rg_search(query, root?)",
        "- apply_patch(patch_text)",
        "",
        "Security:",
        "- deny secrets (.env, keys, engine/config/secrets.json)",
        "- block destructive ops (rm -rf, git reset --hard, etc.)",
        "- allowlist: engine/**, api/**",
      ].join("\n"),
  });

  return true;
}