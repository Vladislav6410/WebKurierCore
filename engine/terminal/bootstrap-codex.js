// engine/terminal/bootstrap-codex.js
// Minimal bootstrap helper to wire Engineer Codex-mode without breaking your terminal.
// You call this ONCE after EngineerAgent instance is created.
//
// Usage (example inside terminal_agent.js after engineerAgent is ready):
//   import { bootstrapEngineerCodex } from "./bootstrap-codex.js";
//   bootstrapEngineerCodex({ engineerAgent });

import { wireEngineerCodexMode } from "./codex-engineer-wiring.js";

/**
 * Wire Codex-mode into EngineerAgent.
 * @param {object} params
 * @param {object} params.engineerAgent - your EngineerAgent instance
 * @param {function} [params.fetchFn] - optional fetch override
 */
export function bootstrapEngineerCodex({ engineerAgent, fetchFn = null }) {
  if (!engineerAgent) {
    throw new Error("bootstrapEngineerCodex: engineerAgent is required");
  }

  wireEngineerCodexMode({
    engineerAgent,
    fetchFn: fetchFn || null,
  });

  return true;
}