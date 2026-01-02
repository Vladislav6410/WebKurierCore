import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { createWorkflowRuntime } from "../engine/workflows/index.js";
import { registerApprovalRoutes } from "../api/approvals.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ один общий runtime на весь сервер
const runtime = createWorkflowRuntime({ dbPath: "data/workflows.sqlite" });

// ✅ подключаем approvals с тем же runtime
registerApprovalRoutes(app, runtime);

// ✅ если у тебя есть UI-файл, который ты показал — положи его сюда:
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get("/approvals/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "approvals", "index.html"));
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Approvals UI: http://localhost:${PORT}/approvals/`);
  console.log(`Approvals API: http://localhost:${PORT}/api/approvals`);
});