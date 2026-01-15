import express from "express";
import cors from "cors";

import { createApiDeps } from "./deps.js";
import { registerAllRoutes } from "./register-routes.js";
import { registerUiRoutes } from "./ui-routes.js";

export function createApiServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  // ✅ deps (Security + Chain clients)
  const deps = createApiDeps();

  // ✅ API routes (MediaCleaner + others)
  registerAllRoutes(app, deps);

  // ✅ UI routes (/ui/media-cleaner)
  registerUiRoutes(app);

  // ✅ Health
  app.get("/health", (req, res) => res.json({ ok: true }));

  return app;
}
