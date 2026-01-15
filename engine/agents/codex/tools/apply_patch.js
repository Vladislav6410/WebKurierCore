// engine/agents/codex/tools/apply_patch.js
// Tool: apply_patch
// Applies unified diff patch with security gates and optional audit logging.

import { validatePatchRequest } from "../policy/security-gates.js";

export function makeApplyPatchTool({ repo, audit = null, policyOptions = {} }) {
  // repo.previewPatch(patchText) -> { filesTouched, stats, summary }
  // repo.applyPatch(patchText)   -> { filesTouched, summary }
  // audit.write(event)           -> void (optional)

  return async function apply_patch({ patch_text }) {
    if (!patch_text) {
      return { ok: false, error: "patch_text is required" };
    }

    // Preview first (no changes)
    const preview = await repo.previewPatch(patch_text);

    const gate = validatePatchRequest(
      {
        filesTouched: preview.filesTouched || [],
        patchText: patch_text,
      },
      policyOptions
    );

    if (!gate.ok) {
      return {
        ok: false,
        blocked: true,
        reason: gate.reason,
        preview,
      };
    }

    // Apply patch
    const result = await repo.applyPatch(patch_text);

    // Optional audit (Chain later)
    if (audit && typeof audit.write === "function") {
      await audit.write({
        type: "codex.apply_patch",
        timestamp: new Date().toISOString(),
        filesTouched: result.filesTouched || preview.filesTouched,
        stats: preview.stats,
        summary: result.summary || preview.summary,
      });
    }

    return {
      ok: true,
      applied: true,
      filesTouched: result.filesTouched || preview.filesTouched,
      summary: result.summary || preview.summary,
    };
  };
}