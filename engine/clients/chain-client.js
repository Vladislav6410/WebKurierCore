/**
 * Chain client adapter.
 * If CHAIN_URL configured -> call Chain service.
 * If not configured -> return a local placeholder response (no mint).
 */

export function createChainClient({ baseUrl, token } = {}) {
  async function mintWebCoins({ userId, amount, reason, meta }) {
    if (!userId) throw new Error("CHAIN: userId required");
    if (!Number.isInteger(amount)) throw new Error("CHAIN: amount must be integer");

    // ✅ Remote Chain
    if (baseUrl) {
      const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/webcoin/mint`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, amount, reason, meta }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`CHAIN_ERROR: ${resp.status} ${txt}`.trim());
      }

      return await resp.json();
    }

    // ⚠️ Local placeholder (no real chain write)
    return {
      ok: true,
      event: {
        type: "WEBCOIN_MINT_PLACEHOLDER",
        userId,
        amount,
        reason,
        meta,
        createdAt: new Date().toISOString(),
      },
      note: "CHAIN_URL not configured (placeholder event only)",
    };
  }

  return { mintWebCoins };
}