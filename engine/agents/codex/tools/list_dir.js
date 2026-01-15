// engine/agents/codex/tools/list_dir.js
// Tool: list_dir
// Lists directory contents via repo adapter.

export function makeListDirTool({ repo }) {
  // repo.listDir(path, { maxDepth }) -> [{ path, type }]
  return async function list_dir({ path, maxDepth = 1 }) {
    if (!path) {
      return { ok: false, error: "Path is required" };
    }

    const entries = await repo.listDir(path, { maxDepth });

    return {
      ok: true,
      path,
      count: Array.isArray(entries) ? entries.length : 0,
      entries,
    };
  };
}