/**
 * Debug API (read-only)
 *
 * Purpose:
 * - Inspect what is реально stored in SQLite
 * - Safe for iPhone checks (no mutations)
 *
 * Endpoints:
 * - GET /api/debug/runs
 * - GET /api/debug/approvals
 */

export function registerDebugRoutes(app, runtime) {
  // List runs (latest first)
  app.get("/api/debug/runs", (req, res) => {
    try {
      const runs = runtime.store.listRuns(100);
      res.json(runs);
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // List approvals (from SQLite approvals store)
  app.get("/api/debug/approvals", async (req, res) => {
    try {
      // динамический импорт, чтобы не тянуть лишнее
      const mod = await import("../engine/workflows/approvals.js");
      const listApprovals = mod.listApprovals;
      res.json(listApprovals());
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}