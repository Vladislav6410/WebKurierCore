// api/rg-adapter.js
// rg adapter (MVP)
// Implements ripgrep search via system `rg` binary.
//
// Requirements:
// - Linux/Ubuntu: `rg` installed (ripgrep)
//   sudo apt-get update && sudo apt-get install -y ripgrep
//
// Returns matches in a structured form:
// [{ path, line, text }]

import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function createRgAdapter({ repoRoot }) {
  if (!repoRoot) throw new Error("repoRoot is required");
  const ROOT = path.resolve(repoRoot);

  function resolveSafe(relPath) {
    const abs = path.resolve(ROOT, relPath);
    if (!abs.startsWith(ROOT)) {
      throw new Error(`Path escape blocked: ${relPath}`);
    }
    return abs;
  }

  return {
    async rg(query, { root = ".", maxResults = 200 } = {}) {
      if (!query) throw new Error("query is required");

      const absRoot = resolveSafe(root);

      // --no-heading: no file headers
      // --line-number: include line numbers
      // --max-count: limits matches per file (we also slice globally)
      // --color never: clean output
      const args = [
        "--no-heading",
        "--line-number",
        "--color",
        "never",
        "--max-count",
        "50",
        query,
        absRoot,
      ];

      let stdout = "";
      try {
        const res = await execFileAsync("rg", args, {
          maxBuffer: 10 * 1024 * 1024,
        });
        stdout = res.stdout || "";
      } catch (e) {
        // rg exits with code 1 when no matches; that's not an error for us
        const code = e?.code;
        const out = e?.stdout || "";
        const err = e?.stderr || "";
        if (code === 1) return [];
        throw new Error(`rg failed: ${err || out || String(e?.message || e)}`);
      }

      // Parse lines: <file>:<line>:<text>
      const lines = stdout.split("\n").filter(Boolean);
      const matches = [];

      for (const line of lines) {
        const first = line.indexOf(":");
        const second = first >= 0 ? line.indexOf(":", first + 1) : -1;
        if (first < 0 || second < 0) continue;

        const filePath = line.slice(0, first);
        const lineNoStr = line.slice(first + 1, second);
        const text = line.slice(second + 1);

        const lineNo = Number(lineNoStr);
        if (!Number.isFinite(lineNo)) continue;

        // Normalize to repo-relative path
        const rel = path
          .relative(ROOT, filePath)
          .replace(/\\/g, "/");

        matches.push({ path: rel, line: lineNo, text });
        if (matches.length >= maxResults) break;
      }

      return matches;
    },
  };
}