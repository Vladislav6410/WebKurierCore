// api/chain-audit.js
// Chain audit hook (MVP, one-file)
//
// Goal:
// - Produce deterministic audit event for every patch/tool action
// - Hash patch + args (SHA-256)
// - Provide a single function auditEvent() for future WebKurierChain wiring
//
// MVP behavior:
// - writes JSONL to local file (server-side): data/chain_audit.log.jsonl
// - later: replace writeToLocal() with WebKurierChain API call

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DEFAULT_LOG_PATH = "data/chain_audit.log.jsonl";

function sha256(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function writeToLocal(logPath, eventObj) {
  const abs = path.resolve(process.cwd(), logPath);
  await ensureDirForFile(abs);
  await fs.appendFile(abs, JSON.stringify(eventObj) + "\n", "utf8");
  return { ok: true, sink: "local_jsonl", path: logPath };
}

/**
 * Create + persist an audit event.
 *
 * @param {object} params
 * @param {string} params.actor        - e.g. "engineer/codex"
 * @param {string} params.tool_name    - e.g. "apply_patch" | "read_file" | "rg_search"
 * @param {object} params.args         - tool args (will be hashed)
 * @param {string[]} [params.file_paths] - files touched (if known)
 * @param {string} [params.patch_text] - for apply_patch (will be hashed)
 * @param {string} [params.session_id] - codex/engineer session id
 * @param {string} [params.summary]    - short human summary
 * @param {string} [params.log_path]   - override log path
 *
 * @returns {Promise<object>} { ok, event, storage }
 */
export async function auditEvent({
  actor,
  tool_name,
  args,
  file_paths = [],
  patch_text = "",
  session_id = null,
  summary = "",
  log_path = DEFAULT_LOG_PATH,
}) {
  if (!actor) throw new Error("auditEvent: actor is required");
  if (!tool_name) throw new Error("auditEvent: tool_name is required");

  const argsJson = JSON.stringify(args || {}, Object.keys(args || {}).sort());
  const event = {
    v: 1,
    ts: nowIso(),
    actor,
    tool_name,
    session_id: session_id || null,

    // hashes (deterministic)
    args_hash: sha256(argsJson),
    patch_hash: patch_text ? sha256(patch_text) : null,

    // metadata
    file_paths: Array.isArray(file_paths) ? file_paths : [],
    summary: summary || "",

    // optional: include small preview lengths (no secrets)
    patch_chars: patch_text ? String(patch_text).length : 0,
  };

  const storage = await writeToLocal(log_path, event);
  return { ok: true, event, storage };
}