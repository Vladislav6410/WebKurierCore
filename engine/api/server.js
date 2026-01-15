import express from "express";
import cors from "cors";

import { createApiDeps } from "./deps.js";
import { registerAllRoutes } from "./register-routes.js";

export function createApiServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  const deps = createApiDeps();
  registerAllRoutes(app, deps);

  app.get("/health", (req, res) => res.json({ ok: true }));

  return app;
}