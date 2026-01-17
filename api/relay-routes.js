// WebKurierCore/api/relay-routes.js
import express from "express";
import { callRelayWebhook } from "./relay-client.js";

export function registerRelayRoutes(app) {
  const router = express.Router();

  /**
   * POST /api/relay/test
   * Sends a test payload to Relay webhook.
   */
  router.post("/test", async (req, res) => {
    const payload = req.body || {};

    // Default demo payload if empty:
    const finalPayload =
      Object.keys(payload).length > 0
        ? payload
        : {
            repo: "WebKurierCore",
            event: "relay.test",
            message: "Hello from WebKurierCore",
            timestamp: new Date().toISOString(),
          };

    const result = await callRelayWebhook(finalPayload);
    res.json({ ok: true, relay: result, sent: finalPayload });
  });

  app.use("/api/relay", router);
}