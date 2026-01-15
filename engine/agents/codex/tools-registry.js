// engine/agents/codex/tools-registry.js
// Registry of tools exposed to CodexAgent.
// Core provides concrete implementations; agent only sees schemas.

export function buildToolsRegistry(toolsImpl) {
  const required = [
    "list_dir",
    "read_file",
    "glob_file_search",
    "rg_search",
    "apply_patch",
  ];

  for (const name of required) {
    if (typeof toolsImpl?.[name] !== "function") {
      throw new Error(`Codex tool missing implementation: ${name}`);
    }
  }

  const tools = [
    {
      name: "list_dir",
      description: "List directory contents by relative path.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxDepth: { type: "integer", default: 1 },
        },
        required: ["path"],
      },
      handler: toolsImpl.list_dir,
    },
    {
      name: "read_file",
      description: "Read a text file from the repository.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxChars: { type: "integer", default: 120000 },
        },
        required: ["path"],
      },
      handler: toolsImpl.read_file,
    },
    {
      name: "glob_file_search",
      description: "Search files by glob pattern.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string" },
          root: { type: "string", default: "." },
          maxResults: { type: "integer", default: 100 },
        },
        required: ["pattern"],
      },
      handler: toolsImpl.glob_file_search,
    },
    {
      name: "rg_search",
      description: "Ripgrep-style text search.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          root: { type: "string", default: "." },
          maxResults: { type: "integer", default: 200 },
        },
        required: ["query"],
      },
      handler: toolsImpl.rg_search,
    },
    {
      name: "apply_patch",
      description: "Apply unified diff patch (ONLY write operation).",
      parameters: {
        type: "object",
        properties: {
          patch_text: { type: "string" },
        },
        required: ["patch_text"],
      },
      handler: toolsImpl.apply_patch,
    },
  ];

  if (typeof toolsImpl.git === "function") {
    tools.push({
      name: "git",
      description: "Run a safe git command.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
      handler: toolsImpl.git,
    });
  }

  if (typeof toolsImpl.cmd === "function") {
    tools.push({
      name: "cmd",
      description: "Run a limited shell command (last resort).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
      handler: toolsImpl.cmd,
    });
  }

  return tools;
}