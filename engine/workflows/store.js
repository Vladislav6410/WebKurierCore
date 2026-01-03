/**
 * SQLite Run Store (persistent)
 * Dependency: better-sqlite3
 *
 * Хранит runs так, чтобы resume работал после перезапуска.
 * Дополнительно: metaJson (например meta.workflowFile)
 */

let Database = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  Database = (await import("better-sqlite3")).default;
} catch (e) {
  Database = null;
}

function nowISO() {
  return new Date().toISOString();
}

function safeJsonParse(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function toRow(run) {
  return {
    id: run.id,
    workflowId: run.workflowId,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    currentStep: run.currentStep,
    error: run.error,
    inputJson: JSON.stringify(run.input ?? {}),
    stepResultsJson: JSON.stringify(run.stepResults ?? {}),
    metaJson: JSON.stringify(run.meta ?? {})
  };
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    workflowId: row.workflowId,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    currentStep: row.currentStep,
    error: row.error,
    input: safeJsonParse(row.inputJson, {}),
    stepResults: safeJsonParse(row.stepResultsJson, {}),
    meta: safeJsonParse(row.metaJson, {})
  };
}

export function createRunStore(options = {}) {
  const { dbPath = "data/workflows.sqlite" } = options;

  if (!Database) {
    throw new Error(
      "SQLite store requires dependency 'better-sqlite3'. Install it: npm install better-sqlite3"
    );
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // create table if not exists (with metaJson)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      status TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      finishedAt TEXT,
      currentStep TEXT,
      error TEXT,
      inputJson TEXT NOT NULL,
      stepResultsJson TEXT NOT NULL,
      metaJson TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_startedAt
    ON workflow_runs(startedAt);

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflowId
    ON workflow_runs(workflowId);
  `);

  // migrate older DBs that don't have metaJson
  const cols = db.prepare(`PRAGMA table_info(workflow_runs);`).all();
  const hasMeta = cols.some(c => c.name === "metaJson");
  if (!hasMeta) {
    db.exec(`ALTER TABLE workflow_runs ADD COLUMN metaJson TEXT NOT NULL DEFAULT '{}';`);
  }

  const stmtInsert = db.prepare(`
    INSERT INTO workflow_runs
    (id, workflowId, status, startedAt, finishedAt, currentStep, error, inputJson, stepResultsJson, metaJson)
    VALUES (@id, @workflowId, @status, @startedAt, @finishedAt, @currentStep, @error, @inputJson, @stepResultsJson, @metaJson)
  `);

  const stmtGet = db.prepare(`SELECT * FROM workflow_runs WHERE id = ?`);

  const stmtUpdate = db.prepare(`
    UPDATE workflow_runs
    SET workflowId=@workflowId,
        status=@status,
        startedAt=@startedAt,
        finishedAt=@finishedAt,
        currentStep=@currentStep,
        error=@error,
        inputJson=@inputJson,
        stepResultsJson=@stepResultsJson,
        metaJson=@metaJson
    WHERE id=@id
  `);

  const stmtList = db.prepare(`
    SELECT * FROM workflow_runs
    ORDER BY startedAt DESC
    LIMIT ?
  `);

  return {
    createRun(run) {
      const r = {
        finishedAt: null,
        currentStep: null,
        error: null,
        stepResults: {},
        input: {},
        meta: {},
        ...run
      };

      if (!r.startedAt) r.startedAt = nowISO();

      stmtInsert.run(toRow(r));
      return r;
    },

    getRun(id) {
      return fromRow(stmtGet.get(id));
    },

    updateRun(id, patch) {
      const existing = this.getRun(id);
      if (!existing) throw new Error("Run not found");

      const merged = { ...existing, ...patch };

      // merge meta safely (patch.meta merges into existing.meta)
      if (patch?.meta && typeof patch.meta === "object") {
        merged.meta = { ...(existing.meta || {}), ...patch.meta };
      }

      stmtUpdate.run(toRow(merged));
      return merged;
    },

    listRuns(limit = 50) {
      return stmtList.all(limit).map(fromRow);
    }
  };
}
