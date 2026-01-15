// api/repo-adapter.js
// Minimal RepoAdapter (MVP)
// Implements: readText, listDir, glob
// Safe, read-only operations only.
// Later we will add rg() and applyPatch().

import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";

/**
 * Create a minimal repository adapter.
 * @param {object} opts
 * @param {string} opts.repoRoot - absolute path to WebKurierCore root
 */
export function createRepoAdapter({ repoRoot }) {
  if (!repoRoot) {
    throw new Error("repoRoot is required");
  }

  const ROOT = path.resolve(repoRoot);

  function resolveSafe(relPath) {
    const abs = path.resolve(ROOT, relPath);
    if (!abs.startsWith(ROOT)) {
      throw new Error(`Path escape blocked: ${relPath}`);
    }
    return abs;
  }

  return {
    /**
     * Read text file with size limit
     */
    async readText(relPath, { maxChars = 120000 } = {}) {
      const abs = resolveSafe(relPath);
      const buf = await fs.readFile(abs, "utf8");
      if (buf.length > maxChars) {
        return buf.slice(0, maxChars) + "\n\n/* truncated */";
      }
      return buf;
    },

    /**
     * List directory contents (non-recursive by default)
     */
    async listDir(relPath, { maxDepth = 1 } = {}) {
      const abs = resolveSafe(relPath);
      const entries = await fg("**/*", {
        cwd: abs,
        onlyFiles: false,
        unique: true,
        dot: false,
        deep: maxDepth,
      });

      return entries.map((p) => {
        const full = path.join(abs, p);
        return {
          path: path.join(relPath, p).replace(/\\/g, "/"),
          type: p.endsWith("/") ? "dir" : "file",
        };
      });
    },

    /**
     * Glob search
     */
    async glob(pattern, { root = ".", maxResults = 100 } = {}) {
      const absRoot = resolveSafe(root);
      const matches = await fg(pattern, {
        cwd: absRoot,
        onlyFiles: true,
        unique: true,
        dot: false,
      });

      return matches
        .slice(0, maxResults)
        .map((p) => path.join(root, p).replace(/\\/g, "/"));
    },
  };
}