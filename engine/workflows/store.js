/**
 * SQLite Run Store (persistent)
 * Dependency: better-sqlite3
 *
 * Хранит runs так, чтобы resume работал после перезапуска.
 *
 * Таблица:
 * - id (runId) PRIMARY KEY
 * - workflowId
 * - status
 * - startedAt
 * - finishedAt
 * - currentStep
 * - error
 * - inputJson
 * - stepResultsJson
 */

let Database = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  Database = (await import("better-sqlite3")).default;
} catch (e) {
  // Если зависимость не установлена — будет понятная ошибка при создании store
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
    stepResultsJson: JSON.stringify(run.stepResults ?? {})
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
    stepResults: safeJsonParse(row.stepResultsJson, {})
  };
}

export function createRunStore(options = {}) {
  const {
    dbPath = "data/workflows.sqlite" // ✅ база будет лежать в WebKurierCore/data/
  } = options;

  if (!Database) {
    throw new Error(
      "SQLite store requires dependency 'better-sqlite3'. Install it: npm install better-sqlite3"
    );
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

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
      stepResultsJson TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_startedAt
    ON workflow_runs(startedAt);

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflowId
    ON workflow_runs(workflowId);
  `);

  const stmtInsert = db.prepare(`
    INSERT INTO workflow_runs
    (id, workflowId, status, startedAt, finishedAt, currentStep, error, inputJson, stepResultsJson)
    VALUES (@id, @workflowId, @status, @startedAt, @finishedAt, @currentStep, @error, @inputJson, @stepResultsJson)
  `);

  const stmtGet = db.prepare(`
    SELECT * FROM workflow_runs WHERE id = ?
  `);

  const stmtUpdate = db.prepare(`
    UPDATE workflow_runs
    SET workflowId=@workflowId,
        status=@status,
        startedAt=@startedAt,
        finishedAt=@finishedAt,
        currentStep=@currentStep,
        error=@error,
        inputJson=@inputJson,
        stepResultsJson=@stepResultsJson
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
        ...run
      };

      // startedAt обязателен
      if (!r.startedAt) r.startedAt = nowISO();

      const row = toRow(r);
      stmtInsert.run(row);
      return r;
    },

    getRun(id) {
      const row = stmtGet.get(id);
      return fromRow(row);
    },

    updateRun(id, patch) {
      const existing = this.getRun(id);
      if (!existing) throw new Error("Run not found");

      const merged = {
        ...existing,
        ...patch
      };

      // если пришли stepResults/input — должны быть объектами
      if (patch?.stepResults && typeof patch.stepResults !== "object") {
        throw new Error("stepResults must be object");
      }
      if (patch?.input && typeof patch.input !== "object") {
        throw new Error("input must be object");
      }

      const row = toRow(merged);
      stmtUpdate.run(row);

      return merged;
    },

    listRuns(limit = 50) {
      const rows = stmtList.all(limit);
      return rows.map(fromRow);
    }
  };
}
