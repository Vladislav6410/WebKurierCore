// engine/agents/codex/codex-agent.js
// CodexAgent core runner for WebKurierCore (MVP).
// Executes agentic coding tasks via OpenAI Responses API (server-side).

import fs from "fs/promises";
import path from "path";
import { buildToolsRegistry } from "./tools-registry.js";

async function loadPrompt(promptPath) {
  const abs = path.isAbsolute(promptPath)
    ? promptPath
    : path.resolve(process.cwd(), promptPath);
  return String(await fs.readFile(abs, "utf8"));
}

export function createCodexAgent({
  openaiClient,
  toolsImpl,
  promptFile,
}) {
  if (!openaiClient || typeof openaiClient.run !== "function") {
    throw new Error("openaiClient.run is required");
  }

  if (!promptFile) {
    throw new Error("promptFile is required");
  }

  const tools = buildToolsRegistry(toolsImpl);

  return {
    async runTask({
      taskText,
      model = "gpt-5.2-codex",
      reasoning = "medium",
      sessionState = null,
    }) {
      if (!taskText) {
        throw new Error("taskText is required");
      }

      const systemPrompt = await loadPrompt(promptFile);

      const input = [
        { role: "system", content: systemPrompt },
        ...(sessionState?.messages || []),
        { role: "user", content: taskText },
      ];

      const result = await openaiClient.run({
        model,
        reasoning,
        input,
        tools,
      });

      return {
        ok: true,
        model,
        reasoning,
        output_text: result.output_text || "",
        trace: result.trace || null,
      };
    },
  };
}