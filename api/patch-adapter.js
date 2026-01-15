// api/patch-adapter.js
// Safe patch adapter (MVP)
// Implements:
//  - previewPatch(patchText) -> { filesTouched, stats, summary }
//  - applyPatch(patchText)   -> { filesTouched, summary }
//
// Strategy (safe, minimal):
// 1) Parse unified diff headers to detect touched files + basic stats.
// 2) Validate with `git apply --check` (no changes).
// 3) Apply with `git apply`.
// 4) No destructive operations, no reset, no clean.
//
// Requirements:
// - git installed
// - repoRoot is a git repository (recommended)
// - patch_text is unified diff

import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function createPatchAdapter({ repoRoot }) {
  if (!repoRoot) throw new Error("repoRoot is required");
  const ROOT = path.resolve(repoRoot);

  function parseUnifiedDiff(patchText) {
    const files = new Set();
    let added = 0;
    let removed = 0;

    const lines = String(patchText || "").split("\n");
    for (const line of lines) {
      // "+++ b/..." or "--- a/..."
      if (line.startsWith("+++ ") || line.startsWith("--- ")) {
        const token = line.slice(4).trim(); // e.g. "b/engine/x.js"
        if (token === "/dev/null") continue;
        // normalize: strip a/ or b/
        const clean = token.replace(/^([ab])\//, "");
        if (clean) files.add(clean);
        continue;
      }
      // Count additions/removals (ignore headers)
      if (line.startsWith("+") && !line.startsWith("+++")) added++;
      if (line.startsWith("-") && !line.startsWith("---")) removed++;
    }

    const filesTouched = Array.from(files).map((p) => p.replace(/\\/g, "/"));

    return {
      filesTouched,
      stats: { added, removed },
      summary: `files=${filesTouched.length}, +${added}/-${removed}`,
    };
  }

  async function gitApplyCheck(patchText) {
    // Use stdin input with execFile
    await execFileAsync("git", ["apply", "--check", "--whitespace=nowarn", "-"], {
      cwd: ROOT,
      maxBuffer: 10 * 1024 * 1024,
      input: patchText,
    });
  }

  async function gitApply(patchText) {
    await execFileAsync("git", ["apply", "--whitespace=nowarn", "-"], {
      cwd: ROOT,
      maxBuffer: 10 * 1024 * 1024,
      input: patchText,
    });
  }

  return {
    async previewPatch(patchText) {
      if (!patchText) throw new Error("patchText is required");
      const preview = parseUnifiedDiff(patchText);

      // Validate patch applicability without changing anything
      // If check fails, throw with message.
      try {
        await gitApplyCheck(patchText);
      } catch (e) {
        const err = e?.stderr || e?.stdout || String(e?.message || e);
        return {
          ...preview,
          ok: false,
          checkError: err,
        };
      }

      return { ...preview, ok: true };
    },

    async applyPatch(patchText) {
      if (!patchText) throw new Error("patchText is required");

      // Ensure patch is applicable first
      await gitApplyCheck(patchText);

      // Apply changes
      await gitApply(patchText);

      const preview = parseUnifiedDiff(patchText);
      return {
        ok: true,
        filesTouched: preview.filesTouched,
        summary: `applied: ${preview.summary}`,
      };
    },
  };
}