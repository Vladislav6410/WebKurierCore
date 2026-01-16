// engine/agents/codex/policy/security-gates.js
// Security gates for Codex apply_patch (MVP)
//
// Enforces:
// - allowlist directories
// - denylist exact paths
// - patch size limits
// - max files touched
//
// NOTE:
// This gate is called BEFORE apply_patch is executed.
// It must be deterministic and side-effect free.

export function validatePatchRequest(
  { filesTouched = [], patchText = "" },
  options = {}
) {
  const {
    allowlist = ["engine/", "api/", "server/", "frontend/"],
    denylist = ["engine/config/secrets.json", ".env"],
    maxPatchChars = 200_000,
    maxFilesTouched = 40,
  } = options;

  // --- basic guards ---
  if (!patchText || typeof patchText !== "string") {
    return fail("patch_text is missing or invalid");
  }

  if (patchText.length > maxPatchChars) {
    return fail(
      `patch too large (${patchText.length} chars > ${maxPatchChars})`
    );
  }

  if (!Array.isArray(filesTouched)) {
    return fail("filesTouched must be an array");
  }

  if (filesTouched.length > maxFilesTouched) {
    return fail(
      `too many files touched (${filesTouched.length} > ${maxFilesTouched})`
    );
  }

  // --- denylist ---
  for (const file of filesTouched) {
    for (const denied of denylist) {
      if (file === denied || file.endsWith(`/${denied}`)) {
        return fail(`denied path: ${file}`);
      }
    }
  }

  // --- allowlist ---
  for (const file of filesTouched) {
    const allowed = allowlist.some((prefix) => file.startsWith(prefix));
    if (!allowed) {
      return fail(
        `path not in allowlist: ${file} (allowed: ${allowlist.join(", ")})`
      );
    }
  }

  // --- heuristic: block obvious destructive intent in patch text ---
  const forbiddenPatterns = [
    /\brm\s+-rf\b/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-fd\b/i,
  ];

  for (const re of forbiddenPatterns) {
    if (re.test(patchText)) {
      return fail("destructive command detected in patch");
    }
  }

  return ok();
}

/* ----------------- helpers ----------------- */

function ok() {
  return { ok: true };
}

function fail(reason) {
  return { ok: false, reason };
}
