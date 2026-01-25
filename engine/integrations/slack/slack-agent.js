// WebKurierCore/engine/integrations/slack/slack-agent.js
// Core → PhoneCore → (optional Security/Chain) → Slack

const crypto = require("crypto");

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function t(cfg, lang, key) {
  const def = (cfg.default_lang || "ru").toLowerCase();
  const dict = (cfg.i18n && cfg.i18n[lang]) ? cfg.i18n[lang] : {};
  const fb = (cfg.i18n && cfg.i18n[def]) ? cfg.i18n[def] : {};
  return (dict && dict[key] != null) ? String(dict[key]) :
         (fb && fb[key] != null) ? String(fb[key]) :
         String(key || "");
}

function isAllowedChannel(cfg, channelId) {
  const allow = Array.isArray(cfg.slack?.allowed_channels) ? cfg.slack.allowed_channels : [];
  const deny = Array.isArray(cfg.slack?.deny_channels) ? cfg.slack.deny_channels : [];
  if (deny.includes(channelId)) return false;
  if (!allow.length) return true; // if allowlist empty => allow all
  return allow.includes(channelId);
}

async function postSlackMessage({ token, channel, text, thread_ts }) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      channel,
      text,
      ...(thread_ts ? { thread_ts } : {})
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!data || data.ok !== true) {
    const err = data && data.error ? data.error : `HTTP_${res.status}`;
    throw new Error(`Slack chat.postMessage failed: ${err}`);
  }
  return data;
}

async function callJson(url, payload, timeoutMs) {
  const ctrl = new AbortController();
  const tmr = setTimeout(() => ctrl.abort(), Math.max(2000, timeoutMs || 20000));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload || {}),
      signal: ctrl.signal
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    if (!data || typeof data !== "object") throw new Error(`Bad JSON from ${url}`);
    return data;
  } finally {
    clearTimeout(tmr);
  }
}

function buildReply(cfg, lang, mainText) {
  const badge = cfg.slack?.prepend_badge ? `*${t(cfg, lang, "badge")}*: ` : "";
  return `${badge}${mainText}`.trim();
}

async function handleMessageEvent(ctx) {
  const { cfg, event, slackToken } = ctx;

  const lang = (ctx.lang || cfg.default_lang || "ru").toLowerCase();
  const channel = event.channel;
  const text = String(event.text || "").trim();
  const user = event.user;
  const threadTs = (cfg.slack?.respond_in_threads && (event.thread_ts || event.ts)) ? (event.thread_ts || event.ts) : undefined;

  if (!isAllowedChannel(cfg, channel)) {
    await postSlackMessage({
      token: slackToken,
      channel,
      text: buildReply(cfg, lang, t(cfg, lang, "err_forbidden")),
      thread_ts: threadTs
    });
    return;
  }

  const maxChars = Number(cfg.limits?.max_text_chars || 8000);
  if (text.length > maxChars) {
    await postSlackMessage({
      token: slackToken,
      channel,
      text: buildReply(cfg, lang, t(cfg, lang, "err_too_long")),
      thread_ts: threadTs
    });
    return;
  }

  // Optional: Security scan (future)
  if (cfg.security?.enabled) {
    try {
      const url = `${cfg.security.base_url}${cfg.security.endpoints.scan_text}`;
      const sec = await callJson(url, { text, channel, user }, cfg.security.timeout_ms);
      if (sec && sec.blocked) {
        await postSlackMessage({
          token: slackToken,
          channel,
          text: buildReply(cfg, lang, "Blocked by Security policy."),
          thread_ts: threadTs
        });
        return;
      }
    } catch {
      // do not hard-fail on security (MVP)
    }
  }

  // PhoneCore: translate+assist (preferred) or chat
  const mode = cfg.mode || "translate_and_assist";
  const pc = cfg.phonecore || {};
  const base = pc.base_url || "http://localhost:3002";

  let replyText = "";
  if (mode === "translate_only") {
    const url = `${base}${pc.endpoints.translate || "/api/translate"}`;
    const out = await callJson(url, { text, lang, channel, user }, pc.timeout_ms);
    replyText = out.translation || out.text || JSON.stringify(out);
  } else {
    const url = `${base}${pc.endpoints.chat || "/api/chat"}`;
    const out = await callJson(url, { text, lang, channel, user }, pc.timeout_ms);
    replyText = out.reply || out.text || JSON.stringify(out);
  }

  await postSlackMessage({
    token: slackToken,
    channel,
    text: buildReply(cfg, lang, replyText),
    thread_ts: threadTs
  });
}

async function handleSlashCommand(ctx) {
  const { cfg, payload, slackToken } = ctx;

  const channel = payload.channel_id;
  const raw = String(payload.text || "").trim();
  const cmd = String(payload.command || "").trim();

  let lang = (ctx.lang || cfg.default_lang || "ru").toLowerCase();

  if (!isAllowedChannel(cfg, channel)) {
    return { text: t(cfg, lang, "err_forbidden") };
  }

  if (cmd === "/wk-help") {
    return { text: t(cfg, lang, "hint_usage") };
  }

  if (cmd === "/wk-lang") {
    const next = raw.toLowerCase();
    const allowed = ["ru", "en", "de", "pl"];
    if (allowed.includes(next)) {
      // Slack не хранит per-user prefs тут; это MVP.
      return { text: `OK. lang=${next}` };
    }
    return { text: "Usage: /wk-lang ru|en|de|pl" };
  }

  // Default: treat as prompt
  const text = raw || "(empty)";
  const pc = cfg.phonecore || {};
  const base = pc.base_url || "http://localhost:3002";
  const url = `${base}${pc.endpoints.chat || "/api/chat"}`;
  const out = await callJson(url, { text, lang, channel, user: payload.user_id }, pc.timeout_ms);
  const replyText = out.reply || out.text || JSON.stringify(out);

  return { text: buildReply(cfg, lang, replyText) };
}

module.exports = {
  handleMessageEvent,
  handleSlashCommand,
  t
};