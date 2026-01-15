import express from "express";
import { createMediaCleanerAgent } from "../../agents/media-cleaner/index.js";

/**
 * Register MediaCleaner routes
 * Paths:
 *  POST /api/media-cleaner/session/start
 *  POST /api/media-cleaner/session/submit
 *  GET  /api/media-cleaner/sessions?userId=...
 *  POST /api/media-cleaner/reward
 */
export function registerMediaCleanerRoutes(app, deps = {}) {
  const router = express.Router();

  const agent = createMediaCleanerAgent({
    securityClient: deps.securityClient,
    chainClient: deps.chainClient,
  });

  // ✅ Start session
  router.post("/session/start", async (req, res) => {
    try {
      const { userId, deviceId, mode } = req.body || {};
      if (!userId || !deviceId) {
        return res.status(400).json({ ok: false, error: "userId and deviceId are required" });
      }
      const out = await agent.startSession({ userId, deviceId, mode });
      return res.json(out);
    } catch (e) {
      return res.status(403).json({ ok: false, error: String(e.message || e) });
    }
  });

  // ✅ Submit results summary (metadata only)
  router.post("/session/submit", async (req, res) => {
    try {
      const { userId, sessionId, resultsSummary } = req.body || {};
      if (!userId || !sessionId || !resultsSummary) {
        return res.status(400).json({
          ok: false,
          error: "userId, sessionId, resultsSummary are required",
        });
      }
      const out = await agent.submitResults({ userId, sessionId, resultsSummary });
      return res.json(out);
    } catch (e) {
      return res.status(403).json({ ok: false, error: String(e.message || e) });
    }
  });

  // ✅ List sessions
  router.get("/sessions", async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId query param is required" });
      }
      const out = await agent.listSessions({ userId });
      return res.json(out);
    } catch (e) {
      return res.status(403).json({ ok: false, error: String(e.message || e) });
    }
  });

  // ✅ Reward cleanup (WebCoins)
  router.post("/reward", async (req, res) => {
    try {
      const { userId, sessionId, freedBytes } = req.body || {};
      if (!userId || !sessionId) {
        return res.status(400).json({ ok: false, error: "userId and sessionId are required" });
      }
      const out = await agent.rewardCleanup({
        userId,
        sessionId,
        freedBytes: Number(freedBytes || 0),
      });
      return res.json(out);
    } catch (e) {
      return res.status(403).json({ ok: false, error: String(e.message || e) });
    }
  });

  app.use("/api/media-cleaner", router);
}