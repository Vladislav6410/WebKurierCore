// engine/agents/codex/tools/glob_file_search.js
// Tool: glob_file_search
// Finds files by glob pattern via repo adapter.

export function makeGlobSearchTool({ repo }) {
  // repo.glob(pattern, { root, maxResults }) -> [paths]
  return async function glob_file_search({
    pattern,
    root = ".",
    maxResults = 100,
  }) {
    if (!pattern) {
      return { ok: false, error: "Pattern is required" };
    }

    const paths = await repo.glob(pattern, { root, maxResults });

    return {
      ok: true,
      pattern,
      root,
      count: Array.isArray(paths) ? paths.length : 0,
      paths,
    };
  };
}