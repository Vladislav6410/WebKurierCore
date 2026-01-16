// engine/agents/codex/codex-agent.js
// CodexAgent runner (MVP)
//
// Responsibilities:
// - Build system + user prompt
// - Call OpenAI Responses API
// - Execute tool calls deterministically
// - Return final output text + optional trace
//
// Notes:
// - Tools are injected (toolsImpl)
// - Security gates are enforced upstream (api/codex-run.js)
// - This runner is stateless; session persistence comes later

import fs from "fs/promises";
import path from "path";

async function readPromptFile(promptFile) {
  const abs = path.resolve(process.cwd(), promptFile);
  const txt = await fs.readFile(abs, "utf8");
  return String(txt || "");
}

function toolSchemasFromImpl(toolsImpl) {
  // Build minimal JSON schemas for tools from implementation keys
  // (kept simple for MVP)
  const schemas = [];
  for (const name of Object.keys(toolsImpl || {})) {
    schemas.push({
      type: "function",
      function: {
        name,
        description: `Tool ${name}`,
        parameters: {
          type: "object",
          additionalProperties: true,
        },
      },
    });
  }
  return schemas;
}

function normalizeTextOutput(resp) {
  // Best-effort extraction of text from Responses API output
  if (!resp) return "";
  const out = resp.output || [];
  let text = "";
  for (const item of out) {
    if (item.type === "output_text" && typeof item.text === "string") {
      text += item.text;
    }
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c.type === "output_text" && typeof c.text === "string") {
          text += c.text;
        }
      }
    }
  }
  return text;
}

export function createCodexAgent({ openaiClient, toolsImpl, promptFile }) {
  if (!openaiClient) throw new Error("createCodexAgent: openaiClient is required");
  if (!toolsImpl) throw new Error("createCodexAgent: toolsImpl is required");
  if (!promptFile) throw new Error("createCodexAgent: promptFile is required");

  const toolSchemas = toolSchemasFromImpl(toolsImpl);

  async function runOnce({ messages, reasoning }) {
    const payload = {
      model: openaiClient.model,
      reasoning: { effort: reasoning || "medium" },
      input: messages,
      tools: toolSchemas,
      tool_choice: "auto",
    };

    return openaiClient.responsesCreate(payload);
  }

  async function handleToolCalls(resp, trace) {
    // Execute all tool calls found in response output
    const out = resp.output || [];
    let anyToolRan = false;

    for (const item of out) {
      if (item.type !== "tool_call") continue;

      const { name, arguments: args, id } = item;
      const fn = toolsImpl[name];
      if (typeof fn !== "function") {
        trace.push({ type: "tool_error", name, error: "unknown tool" });
        continue;
      }

      anyToolRan = true;
      let result;
      try {
        result = await fn(args || {});
      } catch (e) {
        result = { ok: false, error: String(e?.message || e) };
      }

      trace.push({ type: "tool_result", name, args, result });

      // Feed tool result back to model
      messages.push({
        role: "tool",
        tool_name: name,
        content: JSON.stringify(result),
      });
    }

    return anyToolRan;
  }

  return {
    /**
     * Run Codex task end-to-end.
     *
     * @param {object} params
     * @param {string} params.taskText
     * @param {string} [params.reasoning] - low|medium|high|xhigh
     * @param {object|null} [params.sessionState] - reserved for future compaction
     */
    async runTask({ taskText, reasoning = "medium", sessionState = null }) {
      const systemPrompt = await readPromptFile(promptFile);

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: taskText,
        },
      ];

      const trace = [];
      let guard = 0;

      while (guard++ < 20) {
        const resp = await runOnce({ messages, reasoning });
        trace.push({ type: "model_response", id: resp.id || null });

        const ranTools = await handleToolCalls(resp, trace);
        if (!ranTools) {
          // No tool calls -> final answer
          const output_text = normalizeTextOutput(resp);
          return { output_text, trace };
        }
        // else: tools ran, loop again with updated messages
      }

      return {
        output_text:
          "Guard limit reached. The task may require more steps or compaction.",
        trace,
      };
    },
  };
}