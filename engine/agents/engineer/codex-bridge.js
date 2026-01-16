// engine/agents/engineer/codex-bridge.js
// EngineerAgent -> Codex-mode bridge (MVP, universal)
//
// Works with Terminal routing:
//   Terminal "/engineer <argsLine>" -> engineerAgent.execute(argsLine) (or handle/run)
//
// This bridge patches engineerAgent.execute/handle/run to intercept:
//   "codex on|off|ask|tools|prompt|compact"
//
// All non-codex commands are delegated to the original EngineerAgent method.

export function registerEngineerCodexBridge(engineerAgent, deps) {
  if (!engineerAgent) {
    throw new Error("EngineerAgent instance is required");
  }
  if (!deps?.codexService || typeof deps.codexService.run !== "function") {
    throw new Error("deps.codexService.run() is required");
  }

  // Ensure state
  const state = engineerAgent.state || (engineerAgent.state = {});
  state.codex = state.codex || {
    enabled: false,
    sessionId: null,
  };

  // Print helper
  const print =
    typeof engineerAgent.print === "function"
      ? (msg) => engineerAgent.print(msg)
      : (msg) => console.log(msg); // eslint-disable-line no-console

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
        "- Writes are patch-only.",
        "- Security gates block secrets/destructive ops.",
      ].join("\n")
    );
  }

  function promptText() {
    return deps.getPromptInfo?.() || "Prompt file: engine/agents/codex/codex-prompt.md";
  }

  async function handleCodexArgs(argsLine) {
    const raw = String(argsLine || "").trim();
    const parts = raw.split(" ").filter(Boolean);

    // Expect argsLine starting with: "codex ..."
    const scope = (parts[0] || "").toLowerCase();
    if (scope !== "codex") return { handled: false };

    const sub = (parts[1] || "").toLowerCase();
    const rest = parts.slice(2).join(" ").trim();

    switch (sub) {
      case "on":
        state.codex.enabled = true;
        print("✅ Engineer Codex-mode enabled for this session.");
        return { handled: true };

      case "off":
        state.codex.enabled = false;
        print("🛑 Engineer Codex-mode disabled.");
        return { handled: true };

      case "tools":
        print(toolsText());
        return { handled: true };

      case "prompt":
        print(promptText());
        return { handled: true };

      case "ask": {
        if (!state.codex.enabled) {
          print("Codex-mode is OFF. Use: /engineer codex on");
          return { handled: true };
        }
        if (!rest) {
          print("Usage: /engineer codex ask <task>");
          return { handled: true };
        }

        print("⏳ CodexAgent is working (Engineer-owned execution)...");

        const res = await deps.codexService.run({
          taskText: rest,
          sessionId: state.codex.sessionId,
        });

        if (res?.sessionId && !state.codex.sessionId) {
          state.codex.sessionId = res.sessionId;
        }

        print(res?.output_text || "(no output)");
        return { handled: true };
      }

      case "compact":
        print("MVP: compaction not wired yet. Next: store state in Chain (encrypted).");
        return { handled: true };

      default:
        print(
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
        return { handled: true };
    }
  }

  // Patch one of: execute / handle / run (prefer execute)
  const methodName =
    typeof engineerAgent.execute === "function"
      ? "execute"
      : typeof engineerAgent.handle === "function"
        ? "handle"
        : typeof engineerAgent.run === "function"
          ? "run"
          : null;

  if (!methodName) {
    throw new Error(
      "EngineerAgent must implement one of: execute(argsLine) or handle(argsLine) or run(argsLine)"
    );
  }

  // Prevent double-patching
  const patchFlag = "__codex_bridge_patched__";
  if (engineerAgent[patchFlag]) return true;
  engineerAgent[patchFlag] = true;

  const original = engineerAgent[methodName].bind(engineerAgent);

  engineerAgent[methodName] = async (argsLine) => {
    const { handled } = await handleCodexArgs(argsLine);
    if (handled) return true;
    return original(argsLine);
  };

  return true;
}

