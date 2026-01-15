// engine/agents/codex/tools/rg_search.js
// Tool: rg_search
// Performs ripgrep-style text search via repo adapter.

export function makeRgSearchTool({ repo }) {
  // repo.rg(query, { root, maxResults }) -> [{ path, line, text }]
  return async function rg_search({
    query,
    root = ".",
    maxResults = 200,
  }) {
    if (!query) {
      return { ok: false, error: "Query is required" };
    }

    const matches = await repo.rg(query, { root, maxResults });

    return {
      ok: true,
      query,
      root,
      count: Array.isArray(matches) ? matches.length : 0,
      matches,
    };
  };
}