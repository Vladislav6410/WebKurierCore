// engine/agents/codex/policy/security-gates.js
// MVP security gates for CodexAgent file and command operations.
// Enforced by WebKurierCore BEFORE any patch or command is executed.

export const DEFAULT_ALLOWLIST = [
  "engine/",
  "api/",
];

export const DEFAULT_DENYLIST = [
  "engine/config/secrets.json",
  ".env",
];

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf/i,
  /git\s+reset\s+--hard/i,
  /mkfs\./i,
  /dd\s+if=/i,
  /:\(\)\s*{\s*:\s*\|\s*:\s*;\s*}\s*;/, // fork bomb
];

export function isPathAllowed(path, allowlist = DEFAULT_ALLOWLIST, denylist = DEFAULT_DENYLIST) {
  const norm = String(path || "").replace(/\\/g, "/");
  if (!norm) return false;

  for (const deny of denylist) {
    const d = deny.replace(/\\/g, "/");
    if (norm === d || norm.startsWith(d)) return false;
  }

  return allowlist.some((a) => norm.startsWith(a));
}

export function validatePatchRequest({ filesTouched = [], patchText = "" }, opts = {}) {
  const {
    allowlist = DEFAULT_ALLOWLIST,
    denylist = DEFAULT_DENYLIST,
    maxPatchChars = 200_000,
    maxFilesTouched = 40,
  } = opts;

  if (typeof patchText !== "string" || patchText.length === 0) {
    return { ok: false, reason: "Empty patchText" };
  }

  if (patchText.length > maxPatchChars) {
    return { ok: false, reason: `Patch too large (${patchText.length} chars)` };
  }

  if (filesTouched.length > maxFilesTouched) {
    return { ok: false, reason: `Too many files touched (${filesTouched.length})` };
  }

  for (const p of filesTouched) {
    if (!isPathAllowed(p, allowlist, denylist)) {
      return { ok: false, reason: `Path not allowed: ${p}` };
    }
  }

  return { ok: true };
}

export function validateCmd(command) {
  const cmd = String(command || "");
  for (const re of DESTRUCTIVE_PATTERNS) {
    if (re.test(cmd)) {
      return { ok: false, reason: `Destructive command blocked: ${cmd}` };
    }
  }
  return { ok: true };
}