/**
 * Approvals Store (SQLite, persistent)
 *
 * Цель:
 * - approvals не теряются после перезапуска
 * - единый источник правды для UI (/api/approvals) и терминала (/approvals)
 *
 * Dependency:
 * - better-sqlite3
 *
 * Storage:
 * - table: workflow_approvals  (в том же dbPath что и runs)
 *
 * Exports (совместимость):
 * - createApproval(...) / requestApproval(...)  -> создаёт pending approval
 * - listApprovals()
 * - getApproval(id)
 * - resolveApproval(id, decision, comment)
 */

let Database = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  Database = (await import("better-sqlite3")).default;
} catch {
  Database = null;
}

const DEFAULT_DB_PATH = "data/workflows.sqlite";

let _db = null;

function nowISO() {
  return new Date().toISOString();
}

function ensureDb(dbPath = DEFAULT_DB_PATH) {
  if (!Database) {
    throw new Error("Approvals SQLite store requires 'better-sqlite3'. Install: npm i better-sqlite3");
  }
  if (_db) return _db;

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_approvals (
      approvalId TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      stepId TEXT NOT NULL,
      status TEXT NOT NULL,          -- pending | approved | rejected
      title TEXT,
      message TEXT,
      createdAt TEXT NOT NULL,
      decidedAt TEXT,
      decision TEXT,                -- approve | reject
      comment TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status
    ON workflow_approvals(status);

    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_runId
    ON workflow_approvals(runId);
  `);

  return _db;
}

function uuid() {
  // crypto.randomUUID доступен в современных Node
  // fallback на простую генерацию, если нужно
  try {
    // eslint-disable-next-line no-undef
    return crypto.randomUUID();
  } catch {
    return `appr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

function fromRow(r) {
  if (!r) return null;
  return {
    approvalId: r.approvalId,
    runId: r.runId,
    stepId: r.stepId,
    status: r.status,
    title: r.title || "",
    message: r.message || "",
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decision: r.decision,
    comment: r.comment || ""
  };
}

/**
 * Создать pending approval
 * input:
 * { runId, stepId, title?, message? }
 */
export function createApproval(input, options = {}) {
  return requestApproval(input, options);
}

export function requestApproval(input, options = {}) {
  const dbPath = options.dbPath || DEFAULT_DB_PATH;
  const db = ensureDb(dbPath);

  const approvalId = input?.approvalId || uuid();
  const runId = input?.runId;
  const stepId = input?.stepId;
  const title = input?.title || "Approval required";
  const message = input?.message || "";
  const createdAt = input?.createdAt || nowISO();

  if (!runId) throw new Error("requestApproval: runId required");
  if (!stepId) throw new Error("requestApproval: stepId required");

  const stmt = db.prepare(`
    INSERT INTO workflow_approvals
    (approvalId, runId, stepId, status, title, message, createdAt, decidedAt, decision, comment)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL, NULL, '')
  `);

  stmt.run(approvalId, runId, stepId, title, message, createdAt);

  return {
    approvalId,
    runId,
    stepId,
    status: "pending",
    title,
    message,
    createdAt,
    decidedAt: null,
    decision: null,
    comment: ""
  };
}

export function listApprovals(options = {}) {
  const dbPath = options.dbPath || DEFAULT_DB_PATH;
  const db = ensureDb(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM workflow_approvals
    ORDER BY createdAt DESC
    LIMIT 200
  `);

  return stmt.all().map(fromRow);
}

export function getApproval(approvalId, options = {}) {
  const dbPath = options.dbPath || DEFAULT_DB_PATH;
  const db = ensureDb(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM workflow_approvals
    WHERE approvalId = ?
  `);

  return fromRow(stmt.get(approvalId));
}

/**
 * resolveApproval(approvalId, decision, comment)
 * decision: "approve" | "reject"
 */
export function resolveApproval(approvalId, decision, comment = "", options = {}) {
  const dbPath = options.dbPath || DEFAULT_DB_PATH;
  const db = ensureDb(dbPath);

  const existing = getApproval(approvalId, { dbPath });
  if (!existing) throw new Error("Approval not found");

  if (existing.status !== "pending") {
    // уже решено — возвращаем как есть
    return existing;
  }

  const decidedAt = nowISO();
  const status = decision === "approve" ? "approved" : "rejected";

  const stmt = db.prepare(`
    UPDATE workflow_approvals
    SET status = ?,
        decidedAt = ?,
        decision = ?,
        comment = ?
    WHERE approvalId = ?
  `);

  stmt.run(status, decidedAt, decision, String(comment || ""), approvalId);

  return getApproval(approvalId, { dbPath });
}
