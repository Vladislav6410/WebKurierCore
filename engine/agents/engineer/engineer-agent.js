// engine/agents/engineer/engineer-agent.js
// EngineerAgent (minimal core for Terminal integration)
//
// Purpose:
// - Owns engineering-related commands
// - Provides a stable interface for TerminalAgent:
//     - execute(argsLine)  (preferred)
// - Provides print() via injected terminal
// - Holds state object (used by Codex bridge)
//
// Commands (MVP):
// - help
// - codex ...   (handled by codex-bridge via patched execute/handle/run)

export function createEngineerAgent({ terminal }) {
  if (!terminal) {
    throw new Error("createEngineerAgent: terminal is required");
  }

  const state = {};

  const agent = {
    state,

    print(message) {
      terminal.print(message);
    },

    /**
     * Terminal passes argsLine (WITHOUT "/engineer"):
     *   "help"
     *   "codex on"
     *   "codex ask ..."
     */
    async execute(argsLine) {
      const raw = String(argsLine || "").trim();
      const parts = raw.split(" ").filter(Boolean);
      const head = (parts[0] || "").toLowerCase();

      // Basic help
      if (!head || head === "help") {
        agent.print(
          [
            "EngineerAgent commands:",
            "/engineer help",
            "",
            "Codex-mode:",
            "/engineer codex on",
            "/engineer codex off",
            "/engineer codex ask <task>",
            "/engineer codex tools",
            "/engineer codex prompt",
            "/engineer codex compact",
          ].join("\n")
        );
        return true;
      }

      // If not recognized here, return false (so higher-level routing can decide)
      agent.print(`Unknown engineer command: ${raw}`);
      agent.print("Try: /engineer help");
      return false;
    },
  };

  return agent;
}