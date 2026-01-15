// engine/agents/codex/tools/read_file.js
// Tool: read_file
// Reads a text file from repository via repo adapter.

export function makeReadFileTool({ repo }) {
  // repo.readText(path, { maxChars }) -> string
  return async function read_file({ path, maxChars = 120000 }) {
    if (!path) {
      return { ok: false, error: "Path is required" };
    }

    const text = await repo.readText(path, { maxChars });

    return {
      ok: true,
      path,
      length: text.length,
      text,
    };
  };
}