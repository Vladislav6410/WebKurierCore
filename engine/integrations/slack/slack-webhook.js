// WebKurierCore/engine/integrations/slack/slack-webhook.js
// Express router: Slack Events + Slash Commands
// SECURITY: verifies Slack signature using signing secret.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { handleMessageEvent, handleSlashCommand, t } = require("./slack-agent");

function loadConfig() {
  const p = path.join(__dirname, "slack-config.json");
  const raw = fs.readFileSync(p, "utf8");
  const cfg = JSON.parse(raw);
  return cfg;
}

// rawBody for Slack signature verification
function rawBodySaver(req, res, buf) {
  req.rawBody = buf;
}

function verifySlackSignature({ signingSecret, req }) {
  const ts = req.headers["x-slack-request-timestamp"];
  const sig = req.headers["x-slack-signature"];
  if (!ts || !sig) return false;

  // prevent replay (5 min)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(ts)) > 60 * 5) return false;

  const baseString = `v0:${ts}:${req.rawBody ? req.rawBody.toString("utf8") : ""}`;
  const hmac = crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex");
  const mySig = `v0=${hmac}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(mySig), Buffer.from(sig));
  } catch {
    return false;
  }
}

function makeRouter() {
  const router = express.Router();
  const cfg = loadConfig();

  const signingSecret = process.env[cfg.slack?.signing_secret_env || "SLACK_SIGNING_SECRET"] || "";
  const slackToken = process.env[cfg.slack?.bot_token_env || "SLACK_BOT_TOKEN"] || "";

  // body parsers (Slack needs urlencoded for slash, and json for events)
  router.use(express.json({ limit: cfg.slack?.request_body_limit || "1mb", verify: rawBodySaver }));
  router.use(express.urlencoded({ extended: true, limit: cfg.slack?.request_body_limit || "1mb", verify: rawBodySaver }));

  // Healthcheck
  router.get("/health", (req, res) => {
    res.json({ ok: true, enabled: !!cfg.enabled, time: new Date().toISOString() });
  });

  // Slack Events API endpoint
  router.post("/events", async (req, res) => {
    const lang = (cfg.default_lang || "ru").toLowerCase();

    if (!cfg.enabled) return res.status(503).json({ ok: false, error: "Slack integration disabled" });

    if (!signingSecret || !slackToken) {
      return res.status(500).json({ ok: false, error: t(cfg, lang, "err_not_configured") });
    }

    if (!verifySlackSignature({ signingSecret, req })) {
      return res.status(401).json({ ok: false, error: "Bad signature" });
    }

    // URL verification challenge
    if (req.body && req.body.type === "url_verification") {
      return res.json({ challenge: req.body.challenge });
    }

    // Events
    const body = req.body || {};
    const event = body.event || {};

    // Ack fast
    res.json({ ok: true });

    // Ignore bots/self
    if (!event || event.subtype === "bot_message" || event.bot_id) return;

    // We handle message events
    if (event.type === "message" && typeof event.text === "string") {
      try {
        await handleMessageEvent({ cfg, event, slackToken, lang });
      } catch (e) {
        // no rethrow (already acked)
        console.error("[slack] handleMessageEvent error:", e && e.message ? e.message : e);
      }
    }
  });

  // Slash commands endpoint (e.g. /wk-help /wk-lang)
  router.post("/commands", async (req, res) => {
    const lang = (cfg.default_lang || "ru").toLowerCase();

    if (!cfg.enabled) return res.status(503).send("Slack integration disabled");

    if (!signingSecret || !slackToken) {
      return res.status(500).send(t(cfg, lang, "err_not_configured"));
    }

    if (!verifySlackSignature({ signingSecret, req })) {
      return res.status(401).send("Bad signature");
    }

    try {
      const payload = req.body || {};
      const out = await handleSlashCommand({ cfg, payload, slackToken, lang });

      // Slack expects plain text or JSON. We'll respond JSON (works fine).
      res.json(out || { text: "OK" });
    } catch (e) {
      console.error("[slack] slash error:", e && e.message ? e.message : e);
      res.json({ text: t(cfg, lang, "err_internal") });
    }
  });

  return router;
}

module.exports = { makeRouter };