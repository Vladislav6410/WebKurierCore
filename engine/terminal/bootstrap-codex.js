// engine/terminal/bootstrap-codex.js
// Minimal bootstrap helper to wire Engineer Codex-mode safely in Node+Browser.
//
// IMPORTANT:
// - wireEngineerCodexMode is async now (Node may need dynamic import of undici).
// - So bootstrapEngineerCodex must be async and awaited by caller if you want strict startup order.
// - If caller does NOT await, it will still wire in background (but errors may surface later).

import { wireEngineerCodexMode } from "./codex-engineer-wiring.js";

/**
 * Wire Codex-mode into EngineerAgent.
 * @param {object} params
 * @param {object} params.engineerAgent - your EngineerAgent instance
 * @param {function} [params.fetchFn] - optional fetch override
 */
export async function bootstrapEngineerCodex({ engineerAgent, fetchFn = null }) {
  if (!engineerAgent) {
    throw new Error("bootstrapEngineerCodex: engineerAgent is required");
  }

  await wireEngineerCodexMode({
    engineerAgent,
    fetchFn: fetchFn || null,
  });

  return true;
}
