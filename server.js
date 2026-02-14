/**
 * WebKurierCore — server.js (MVP)
 * - Express server
 * - mounts DronePlanner API routes
 * - serves DronePlanner UI as static
 * - allows embedding UI into WebKurierSite via iframe (CSP frame-ancestors)
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

// --- Allow embedding Core UI into WebKurierSite (iframe) ---
const SITE_ORIGIN = "https://site.webkurier.eu";

app.use((req, res, next) => {
  // CSP is the modern, correct way (works in modern browsers)
  res.setHeader(
    "Content-Security-Policy",
    `frame-ancestors 'self' ${SITE_ORIGIN}`
  );

  // X-Frame-Options is legacy; SAMEORIGIN would block cross-domain iframes.
  // We keep SAMEORIGIN by default, but for requests coming from the site origin
  // we try to allow embedding (some browsers ignore ALLOW-FROM, CSP still does the job).
  const referer = String(req.headers.referer || "");
  if (referer.startsWith(SITE_ORIGIN)) {
    res.setHeader("X-Frame-Options", `ALLOW-FROM ${SITE_ORIGIN}`);
  } else {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }

  next();
});

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
  console.log(`✅ Iframe allowed for: ${SITE_ORIGIN}`);
});
