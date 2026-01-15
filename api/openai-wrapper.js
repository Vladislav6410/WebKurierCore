// api/openai-wrapper.js
// Real OpenAI Responses API wrapper with tool-calling loop (MVP)
//
// Uses official OpenAI JS SDK: npm i openai
// Env: OPENAI_API_KEY must be set server-side (via WebKurierHybrid secrets)
//
// Implements:
//   openaiClient.run({ model, reasoning, input, tools }) -> { output_text, trace? }
//
// Notes:
// - `tools` is expected in the WebKurierCodex internal registry format:
//   [{ name, description, parameters, handler }, ...]
// - This wrapper converts them to Responses API function tools and executes tool calls
//   until the model produces final text output or maxIterations reached.

import OpenAI from "openai";

export function createOpenAIWrapper(opts = {}) {
  const {
    apiKey = process.env.OPENAI_API_KEY,
    maxIterations = 12,
    parallelToolCalls = true,
  } = opts;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing (server-side env required)");
  }

  const client = new OpenAI({ apiKey });

  return {
    /**
     * @param {object} params
     * @param {string} params.model
     * @param {string} params.reasoning - low|medium|high
     * @param {Array}  params.input - array of {role, content} items (may include system at first)
     * @param {Array}  params.tools - internal tools registry: [{name, description, parameters, handler}]
     */
    async run({ model, reasoning = "medium", input, tools }) {
      const { instructions, inputItems } = normalizeInput(input);

      const toolDefs = (tools || []).map((t) => ({
        type: "function",
        name: t.name,
        description: t.description || "",
        parameters: t.parameters || { type: "object", properties: {} },
      }));

      const handlerMap = new Map();
      for (const t of tools || []) {
        handlerMap.set(t.name, t.handler);
      }

      // We maintain a running "input list" (like the official tool-calling flow)
      // by appending response.output + function_call_output items.
      const context = [...inputItems];

      let lastResponse = null;

      for (let step = 0; step < maxIterations; step++) {
        const response = await client.responses.create({
          model,
          instructions,
          input: context,
          tools: toolDefs,
          parallel_tool_calls: parallelToolCalls,
          reasoning: { effort: reasoning },
        });

        lastResponse = response;

        // Always append output items to context for next turn
        if (Array.isArray(response.output) && response.output.length) {
          context.push(...response.output);
        }

        const calls = extractFunctionCalls(response);
        if (!calls.length) {
          // No tool calls => final answer
          return {
            output_text: response.output_text || "",
            trace: { steps: step + 1 },
          };
        }

        // Execute tool calls and provide outputs back to the model
        for (const call of calls) {
          const handler = handlerMap.get(call.name);
          if (!handler) {
            context.push({
              type: "function_call_output",
              call_id: call.call_id,
              output: JSON.stringify({
                ok: false,
                error: `No handler for tool: ${call.name}`,
              }),
            });
            continue;
          }

          let argsObj = {};
          try {
            argsObj = call.arguments ? JSON.parse(call.arguments) : {};
          } catch {
            // If arguments aren't valid JSON, pass raw string
            argsObj = { _raw: call.arguments };
          }

          let toolResult;
          try {
            toolResult = await handler(argsObj);
          } catch (e) {
            toolResult = { ok: false, error: String(e?.message || e) };
          }

          context.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(toolResult ?? { ok: true }),
          });
        }
      }

      // If we reach here, we hit max iterations
      return {
        output_text:
          (lastResponse && lastResponse.output_text) ||
          "Codex: max tool-call iterations reached.",
        trace: { steps: maxIterations, stopped: true },
      };
    },
  };
}

/* ----------------- Helpers ----------------- */

function normalizeInput(input) {
  const arr = Array.isArray(input) ? input : [{ role: "user", content: String(input || "") }];

  // If first message is system, map it to Responses `instructions`
  let instructions = "";
  const inputItems = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (i === 0 && item?.role === "system") {
      instructions = String(item.content || "");
      continue;
    }
    // Responses accepts {role, content} message items
    if (item?.role && typeof item.content !== "undefined") {
      inputItems.push({ role: item.role, content: item.content });
    } else {
      // passthrough (already an item, e.g. function_call_output)
      inputItems.push(item);
    }
  }

  return { instructions, inputItems };
}

function extractFunctionCalls(response) {
  const out = [];
  const items = Array.isArray(response?.output) ? response.output : [];
  for (const item of items) {
    // In Responses API, custom tool calls are returned as type === "function_call"
    if (item?.type === "function_call") {
      out.push({
        type: item.type,
        name: item.name,
        call_id: item.call_id,
        arguments: item.arguments,
      });
    }
  }
  return out;
}