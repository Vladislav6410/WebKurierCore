import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { createWorkflowRuntime } from "../engine/workflows/index.js";
import { registerApprovalRoutes } from "../api/approvals.js";
import { registerDebugRoutes } from "../api/debug.js";

// ✅ Codex endpoint
import { registerCodexRunRoute } from "../api/codex-run.js";

const app = express();

// --- middlewares ---
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ один общий runtime на весь сервер (SQLite)
const runtime = createWorkflowRuntime({ dbPath: "data/workflows.sqlite" });

// --- API routes ---
registerApprovalRoutes(app, runtime);
registerDebugRoutes(app, runtime);

// ✅ /api/codex/run
// repoRoot: корень репозитория WebKurierCore (process.cwd() при запуске из корня)
registerCodexRunRoute(app, {
  repoRoot: process.cwd(),
  promptFile: "engine/agents/codex/codex-prompt.md",
});

// --- frontend static ---
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// approvals UI
app.get("/approvals/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "approvals", "index.html"));
});

// --- health ---
app.get("/health", (req, res) => res.json({ ok: true }));

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Health:        http://localhost:${PORT}/health`);
  console.log(`Approvals UI:  http://localhost:${PORT}/approvals/`);
  console.log(`Approvals API: http://localhost:${PORT}/api/approvals`);
  console.log(`Debug runs:    http://localhost:${PORT}/api/debug/runs`);
  console.log(`Debug appr:    http://localhost:${PORT}/api/debug/approvals`);
  console.log(`Codex API:     http://localhost:${PORT}/api/codex/run`);
});