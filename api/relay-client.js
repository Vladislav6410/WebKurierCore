/**
 * WebKurierCore Relay Webhook Client (Node.js v18+)
 * Uses built-in fetch (no node-fetch dependency required).
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
