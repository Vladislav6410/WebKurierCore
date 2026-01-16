// engine/terminal/codex-engineer-wiring.js
// Wiring layer: Terminal -> EngineerAgent -> Codex bridge (MVP)
//
// Node + Browser compatible fetch.
// - In browser: uses global fetch
// - In Node: uses global fetch if present, otherwise falls back to undici.
//
// Backend:
//  POST /api/codex/run  { taskText, sessionId }
// Response:
//  { output_text, sessionId?, trace? }

import { registerEngineerCodexBridge } from "../agents/engineer/codex-bridge.js";

async function getFetchImpl(explicitFetch) {
  if (explicitFetch) return explicitFetch;

  if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }

  // Node fallback: undici
  // Install: npm i undici
  try {
    const { fetch } = await import("undici");
    if (typeof fetch === "function") return fetch;
  } catch (e) {
    // ignore and throw below
  }

  throw new Error(
    "No fetch() available. Use Node 18+ (global fetch) or install undici: npm i undici, " +
      "or pass fetchFn into wireEngineerCodexMode()."
  );
}

/**
 * Wire Engineer Codex-mode into the running EngineerAgent.
 *
 * @param {object} params
 * @param {object} params.engineerAgent - instance of EngineerAgent
 * @param {function} [params.fetchFn] - optional fetch override
 */
export async function wireEngineerCodexMode({ engineerAgent, fetchFn = null }) {
  if (!engineerAgent) {
    throw new Error("wireEngineerCodexMode: engineerAgent is required");
  }

  const fetchImpl = await getFetchImpl(fetchFn);

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
        "- allowlist: engine/**, api/**, server/**, frontend/**",
      ].join("\n"),
  });

  return true;
}
