// engine/agents/codex/tools-repo-adapter.js
// Repo Adapter (MVP, server-side)
//
// Provides safe filesystem + search + patch apply primitives for Codex tools.
// Used by api/codex-run.js
//
// Notes:
// - rg_search uses system `rg` (ripgrep)
// - apply_patch uses system `git apply` (repo should be a git working tree)
// - security gates must run BEFORE applyPatch (handled in api/codex-run.js)

import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function assertRelPath(relPath) {
  if (typeof relPath !== "string" || !relPath.trim()) throw new Error("path is required");
  if (relPath.includes("\0")) throw new Error("invalid path");
}

function safeResolve(repoRoot, relPath) {
  assertRelPath(relPath);
  const rootAbs = path.resolve(repoRoot);
  const abs = path.resolve(rootAbs, relPath);
  if (!abs.startsWith(rootAbs)) throw new Error("Path escapes repo root");
  return { rootAbs, abs };
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walkDir(rootAbs, relBase, maxDepth) {
  const out = [];
  async function walk(currentRel, depth) {
    if (depth > maxDepth) return;

    const { abs } = safeResolve(rootAbs, currentRel);
    const entries = await fs.readdir(abs, { withFileTypes: true });

    for (const ent of entries) {
      const nextRel = path.posix.join(currentRel.replace(/\\/g, "/"), ent.name);
      out.push({
        path: nextRel,
        type: ent.isDirectory() ? "dir" : ent.isFile() ? "file" : "other",
      });
      if (ent.isDirectory()) {
        await walk(nextRel, depth + 1);
      }
    }
  }

  await walk(relBase, 0);
  return out;
}

// very small glob matcher: supports "*", "**", "?" (POSIX-style)
// pattern examples: "**/*.js", "engine/**/index.html"
function globToRegex(pattern) {
  const p = pattern.replace(/\\/g, "/");
  let re = "^";
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];

    // ** -> match any (including /)
    if (ch === "*" && p[i + 1] === "*") {
      // consume both
      i++;
      // optional following slash
      if (p[i + 1] === "/") i++;
      re += ".*";
      continue;
    }

    // * -> match any except /
    if (ch === "*") {
      re += "[^/]*";
      continue;
    }

    // ? -> match one except /
    if (ch === "?") {
      re += "[^/]";
      continue;
    }

    // escape regex specials
    if ("+.^$|()[]{}".includes(ch)) {
      re += "\\" + ch;
    } else {
      re += ch;
    }
  }
  re += "$";
  return new RegExp(re);
}

async function listAllFiles(rootAbs, relRoot, maxResults) {
  const results = [];
  async function walk(relDir) {
    if (results.length >= maxResults) return;

    const { abs } = safeResolve(rootAbs, relDir);
    const entries = await fs.readdir(abs, { withFileTypes: true });

    for (const ent of entries) {
      if (results.length >= maxResults) return;
      const nextRel = path.posix.join(relDir.replace(/\\/g, "/"), ent.name);
      if (ent.isDirectory()) {
        await walk(nextRel);
      } else if (ent.isFile()) {
        results.push(nextRel);
      }
    }
  }
  await walk(relRoot);
  return results;
}

export function createRepoAdapter({ repoRoot }) {
  if (!repoRoot) throw new Error("createRepoAdapter: repoRoot is required");
  const rootAbs = path.resolve(repoRoot);

  return {
    async listDir(relPath, { maxDepth = 2 } = {}) {
      const base = String(relPath || ".").trim() || ".";
      const depth = Number.isFinite(maxDepth) ? maxDepth : 2;
      const items = await walkDir(rootAbs, base, Math.max(0, Math.min(depth, 10)));
      return { ok: true, root: base, items };
    },

    async readFile(relPath, { maxChars = 200000 } = {}) {
      const { abs } = safeResolve(rootAbs, relPath);
      const buf = await fs.readFile(abs);
      const text = buf.toString("utf8");
      const cut = text.length > maxChars ? text.slice(0, maxChars) : text;
      return {
        ok: true,
        path: relPath,
        truncated: text.length > maxChars,
        text: cut,
      };
    },

    async glob(pattern, { root = ".", maxResults = 200 } = {}) {
      const relRoot = String(root || ".").trim() || ".";
      const limit = Math.max(1, Math.min(Number(maxResults) || 200, 1000));
      const re = globToRegex(String(pattern || "").trim());
      if (!pattern) throw new Error("glob: pattern is required");

      const files = await listAllFiles(rootAbs, relRoot, limit * 5); // buffer
      const matched = [];
      for (const f of files) {
        if (matched.length >= limit) break;
        if (re.test(f)) matched.push(f);
      }

      return { ok: true, pattern, root: relRoot, matches: matched };
    },

    async rg(query, { root = ".", maxResults = 200 } = {}) {
      const relRoot = String(root || ".").trim() || ".";
      const limit = Math.max(1, Math.min(Number(maxResults) || 200, 2000));
      if (!query) throw new Error("rg: query is required");

      // ensure root exists
      const { abs: absRoot } = safeResolve(rootAbs, relRoot);
      if (!(await fileExists(absRoot))) {
        return { ok: false, error: `rg root not found: ${relRoot}` };
      }

      // ripgrep output: file:line:col:text (with --column --line-number)
      const args = [
        "--column",
        "--line-number",
        "--no-heading",
        "--color",
        "never",
        "--max-count",
        String(limit),
        query,
        absRoot,
      ];

      try {
        const { stdout } = await execFileAsync("rg", args, {
          cwd: rootAbs,
          maxBuffer: 10 * 1024 * 1024,
        });

        const lines = String(stdout || "")
          .split("\n")
          .filter(Boolean)
          .slice(0, limit);

        return { ok: true, query, root: relRoot, matches: lines };
      } catch (e) {
        // rg exit code 1 = no matches
        const code = e?.code;
        if (code === 1) {
          return { ok: true, query, root: relRoot, matches: [] };
        }
        return { ok: false, error: String(e?.message || e) };
      }
    },

    async applyPatch(patchText) {
      if (!patchText || typeof patchText !== "string") {
        throw new Error("applyPatch: patchText is required");
      }

      // MVP: use git apply
      // - keep it strict; if repo isn't git, ask user to init git or add a patch engine later
      const gitDir = path.join(rootAbs, ".git");
      if (!(await fileExists(gitDir))) {
        return {
          ok: false,
          error:
            "apply_patch requires a git working tree (missing .git). " +
            "Initialize git or add a non-git patch engine later.",
        };
      }

      const args = ["apply", "--whitespace=nowarn", "--unsafe-paths", "-"];

      try {
        await execFileAsync("git", args, {
          cwd: rootAbs,
          input: patchText,
          maxBuffer: 10 * 1024 * 1024,
        });

        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e?.stderr || e?.message || e) };
      }
    },
  };
}