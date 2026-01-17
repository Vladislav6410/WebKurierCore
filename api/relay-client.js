// WebKurierCore/api/relay-client.js
import fetch from "node-fetch";

/**
 * Relay Webhook Client
 * Sends JSON payloads to Relay.app workflow webhook.
 */
export async function callRelayWebhook(payload = {}, opts = {}) {
  const url = process.env.RELAY_WEBHOOK_URL || opts.url;
  if (!url) {
    return {
      ok: false,
      error: "RELAY_WEBHOOK_URL is missing",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      body: text,
    };
  } catch (e) {
    return {
      ok: false,
      error: String(e?.message || e),
    };
  }
}