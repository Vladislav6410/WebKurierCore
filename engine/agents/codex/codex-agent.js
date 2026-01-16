// engine/agents/codex/codex-agent.js
// CodexAgent (MVP)
//
// Responsibilities:
// - Load system prompt (codex-prompt.md)
// - Expose a single runTask() that uses OpenAI wrapper with tool-calls
// - Provide tools in a strict, minimal form
//
// This agent runs server-side (called by /api/codex/run).
// OpenAI keys are never on client.

import fs from "fs/promises";
import path from "path";

export function createCodexAgent({ openaiClient, toolsImpl, promptFile }) {
  if (!openaiClient || typeof openaiClient.run !== "function") {
    throw new Error("createCodexAgent: openaiClient.run() is required");
  }
  if (!toolsImpl || typeof toolsImpl !== "object") {
    throw new Error("createCodexAgent: toolsImpl is required");
  }
  if (!promptFile) {
    throw new Error("createCodexAgent: promptFile is required");
  }

  async function loadPromptText() {
    const p = path.resolve(process.cwd(), promptFile);
    return await fs.readFile(p, "utf8");
  }

  function buildToolsRegistry() {
    // Minimal JSON-schema parameters for tool calling
    // Each handler returns JSON-serializable object
    return [
      {
        name: "list_dir",
        description: "List directory contents",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            maxDepth: { type: "integer", minimum: 1, maximum: 10 },
          },
          required: ["path"],
          additionalProperties: false,
        },
        handler: async (args) => toolsImpl.list_dir(args),
      },
      {
        name: "read_file",
        description: "Read a text file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            maxChars: { type: "integer", minimum: 1000, maximum: 300000 },
          },
          required: ["path"],
          additionalProperties: false,
        },
        handler: async (args) => toolsImpl.read_file(args),
      },
      {
        name: "glob_file_search",
        description: "Search files by glob pattern",
        parameters: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            root: { type: "string" },
            maxResults: { type: "integer", minimum: 1, maximum: 1000 },
          },
          required: ["pattern"],
          additionalProperties: false,
        },
        handler: async (args) => toolsImpl.glob_file_search(args),
      },
      {
        name: "rg_search",
        description: "Search in files by ripgrep (fast text search)",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            root: { type: "string" },
            maxResults: { type: "integer", minimum: 1, maximum: 2000 },
          },
          required: ["query"],
          additionalProperties: false,
        },
        handler: async (args) => toolsImpl.rg_search(args),
      },
      {
        name: "apply_patch",
        description: "Apply unified diff patch (safe, gated). Use small patches.",
        parameters: {
          type: "object",
          properties: {
            patch_text: { type: "string" },
          },
          required: ["patch_text"],
          additionalProperties: false,
        },
        handler: async (args) => toolsImpl.apply_patch(args),
      },
    ];
  }

  return {
    /**
     * Run Codex task end-to-end with tool calling.
     * @param {object} params
     * @param {string} params.taskText
     * @param {string} [params.reasoning] - low|medium|high
     * @param {object|null} [params.sessionState] - reserved for compaction later
     */
    async runTask({ taskText, reasoning = "medium", sessionState = null }) {
      const systemPrompt = await loadPromptText();
      const tools = buildToolsRegistry();

      // NOTE:
      // - We keep input minimal on MVP.
      // - For compaction later, we will add sessionState.messages.
      const input = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            [
              "Task:",
              taskText,
              "",
              "Rules:",
              "- Use tools (read/list/search) before editing.",
              "- Apply changes via apply_patch only.",
              "- Keep patches small and explain what changed.",
              "- Never touch secrets (.env, engine/config/secrets.json).",
            ].join("\n"),
        },
      ];

      const model = process.env.OPENAI_CODEX_MODEL || "gpt-5.2-codex";

      const res = await openaiClient.run({
        model,
        reasoning,
        input,
        tools,
      });

      return {
        output_text: res?.output_text || "",
        trace: res?.trace || null,
        sessionState: sessionState || null,
      };
    },
  };
}
