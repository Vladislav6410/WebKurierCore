/**
 * Workflow Registry (MVP)
 *
 * Задача:
 * - хранить связь workflowId -> workflowFile
 * - использовать в approvals resume (чтобы не было DEFAULT_WORKFLOW_FILE)
 *
 * MVP стратегия:
 * 1) При запуске workflow мы сохраняем workflowFile в run (run.meta.workflowFile)
 * 2) Если meta нет (старые runs) — fallback на workflowId map (если добавлен)
 *
 * Позже:
 * - сделать таблицу workflow_registry в SQLite
 * - или хранить в WebKurierChain (append-only)
 */

import path from "path";

export function createWorkflowRegistry() {
  const map = new Map(); // workflowId -> filePath

  return {
    register(workflowId, filePath) {
      if (!workflowId || !filePath) throw new Error("workflowId and filePath required");
      map.set(workflowId, filePath);
    },

    resolveById(workflowId) {
      return map.get(workflowId) || null;
    }
  };
}

/**
 * Resolve workflow file for a given run.
 * Priority:
 * 1) run.meta.workflowFile (best, per-run accurate)
 * 2) registry map by workflowId (fallback)
 */
export function resolveWorkflowFileForRun(run, registry) {
  if (!run) return null;

  const metaFile = run?.meta?.workflowFile;
  if (metaFile) return metaFile;

  const byId = registry?.resolveById?.(run.workflowId);
  if (byId) return byId;

  return null;
}

/**
 * Normalize a file path to absolute or stable relative.
 * If you pass absolute paths everywhere — this becomes a no-op.
 */
export function normalizeWorkflowFile(filePath) {
  if (!filePath) return null;
  return path.normalize(filePath);
}