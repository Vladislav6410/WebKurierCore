/**
 * WebKurierCore — server.js (MVP)
 * - Express server
 * - mounts DronePlanner API routes
 * - serves DronePlanner UI as static
 *
 * Run:
 *   node server.js
 *
 * Env:
 *   PORT=8080
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import droneplannerRoutes from "./engine/api/droneplanner.routes.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- API ---
app.use("/api", droneplannerRoutes);

// --- Static UI (MVP) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If you keep UI inside engine/agents/droneplanner/ui/
const uiDir = path.join(__dirname, "engine", "agents", "droneplanner", "ui");
app.use("/droneplanner", express.static(uiDir));

// Simple index redirect (optional)
app.get("/", (req, res) => res.redirect("/droneplanner/droneplanner-core.html"));

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`✅ WebKurierCore running on http://localhost:${port}`);
  console.log(`✅ DronePlanner UI: http://localhost:${port}/droneplanner/droneplanner-core.html`);
});