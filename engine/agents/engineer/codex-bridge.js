// engine/agents/engineer/codex-bridge.js
// EngineerAgent -> Codex-mode bridge (MVP)
//
// Goal:
// - CodexAgent is NOT a separate authority.
// - EngineerAgent remains the owner of "file changes" privileges.
// - This bridge exposes engineer-style commands:
//   /engineer codex on|off|ask|tools|prompt|compact
//
// Wiring model:
// Terminal -> EngineerAgent -> codexService(server) -> CodexAgent -> tools -> repo
//
// IMPORTANT:
// - openai keys are server-side only.
// - any patch/apply step must be gated (policy/security-gates.js).

export function registerEngineerCodexBridge(engineerAgent, deps) {
  // deps:
  //  - codexService: { run({ taskText, sessionId? }) -> { output_text, trace? } }
  //  - getPromptInfo?: () -> string (optional)
  //  - getToolsInfo?: () -> string (optional)
  //
  // engineerAgent expected interface:
  //  - registerCommand(name, handler)
  //  - print(text)
  //  - state (object)

  if (!engineerAgent || typeof engineerAgent.registerCommand !== "function") {
    throw new Error("EngineerAgent instance with registerCommand() is required");
  }
  if (!deps?.codexService || typeof deps.codexService.run !== "function") {
    throw new Error("deps.codexService.run() is required");
  }

  const state = engineerAgent.state || (engineerAgent.state = {});
  state.codex = state.codex || {
    enabled: false,
    // sessionId can be used later for Chain-compaction state
    sessionId: null,
  };

  function toolsText() {
    return (
      deps.getToolsInfo?.() ||
      [
        "Tools (MVP):",
        "- list_dir(path)",
        "- read_file(path)",
        "- glob_file_search(pattern, root?)",
        "- rg_search(query, root?)",
        "- apply_patch(patch_text)",
        "",
        "Notes:",
        "- Writes are patch-only (no full rewrites).",
        "- Security gates block secrets/destructive ops.",
      ].join("\n")
    );
  }

  function promptText() {
    return (
      deps.getPromptInfo?.() ||
      "Prompt file: engine/agents/codex/codex-prompt.md"
    );
  }

  engineerAgent.registerCommand("engineer", async (argsLine) => {
    const raw = String(argsLine || "").trim();
    const parts = raw.split(" ").filter(Boolean);

    // Expect: /engineer codex <sub> ...
    const scope = (parts[0] || "").toLowerCase();
    const sub = (parts[1] || "").toLowerCase();
    const rest = parts.slice(2).join(" ").trim();

    if (scope !== "codex") {
      // Not our scope. Let EngineerAgent handle other /engineer commands.
      return false; // convention: return false to pass-through
    }

    switch (sub) {
      case "on":
        state.codex.enabled = true;
        engineerAgent.print("✅ Engineer Codex-mode enabled for this session.");
        return true;

      case "off":
        state.codex.enabled = false;
        engineerAgent.print("🛑 Engineer Codex-mode disabled.");
        return true;

      case "tools":
        engineerAgent.print(toolsText());
        return true;

      case "prompt":
        engineerAgent.print(promptText());
        return true;

      case "ask": {
        if (!state.codex.enabled) {
          engineerAgent.print("Codex-mode is OFF. Use: /engineer codex on");
          return true;
        }
        if (!rest) {
          engineerAgent.print("Usage: /engineer codex ask <task>");
          return true;
        }

        engineerAgent.print("⏳ CodexAgent is working (Engineer-owned execution)...");

        const res = await deps.codexService.run({
          taskText: rest,
          sessionId: state.codex.sessionId,
        });

        if (res?.sessionId && !state.codex.sessionId) {
          state.codex.sessionId = res.sessionId;
        }

        engineerAgent.print(res?.output_text || "(no output)");
        return true;
      }

      case "compact":
        engineerAgent.print("MVP: compaction not wired yet. Next: store state in Chain (encrypted).");
        return true;

      default:
        engineerAgent.print(
          [
            "Engineer Codex-mode commands:",
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
  });
}