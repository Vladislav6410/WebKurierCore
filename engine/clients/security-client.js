/**
 * Security client adapter.
 * If SECURITY_URL is configured -> call Security service.
 * If not configured -> deny by default (safe).
 * For local dev you may enable DEV_ALLOW_SECURITY=1 (still requires userId).
 */

export function createSecurityClient({ baseUrl, token, devAllow = false } = {}) {
  async function assertAllowed(action, ctx) {
    if (!ctx?.userId) throw new Error("SECURITY_DENIED: userId required");

    // ✅ Remote Security
    if (baseUrl) {
      const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/policy/assert`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, ctx }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`SECURITY_DENIED: ${resp.status} ${txt}`.trim());
      }

      const data = await resp.json().catch(() => ({}));
      if (!data?.ok) throw new Error(`SECURITY_DENIED: ${data?.error || "not allowed"}`);
      return true;
    }

    // ✅ Local dev mode (explicitly enabled)
    if (devAllow) {
      return true;
    }

    // ❌ Safe default
    throw new Error("SECURITY_DENIED: SECURITY_URL not configured");
  }

  return { assertAllowed };
}