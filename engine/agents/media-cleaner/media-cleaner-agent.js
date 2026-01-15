/**
 * MediaCleanerAgent — orchestrator module for SmartSort (gallery cleanup).
 * Role: Core-level gateway.
 * - Keeps user settings, scan sessions, sync metadata
 * - Talks to Security for validation/policy
 * - Talks to Chain for license/WebCoin events
 * - Mobile devices do on-device scan (privacy-first)
 */

export class MediaCleanerAgent {
  constructor({ securityClient, chainClient, storage }) {
    this.security = securityClient;
    this.chain = chainClient;
    this.storage = storage;
  }

  // ✅ Start scan session (metadata only)
  async startSession({ userId, deviceId, mode = "local_only" }) {
    await this.security.assertAllowed("mediaCleaner:startSession", { userId, deviceId });

    const session = {
      sessionId: `mc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      userId,
      deviceId,
      mode, // local_only | sync_enabled
      createdAt: new Date().toISOString(),
      status: "started",
    };

    await this.storage.saveSession(session);

    return { ok: true, session };
  }

  // ✅ Save scan results summary (no raw images)
  async submitResults({ userId, sessionId, resultsSummary }) {
    await this.security.assertAllowed("mediaCleaner:submitResults", { userId, sessionId });

    // store only safe metadata
    await this.storage.saveResultsSummary({ userId, sessionId, resultsSummary });

    return { ok: true };
  }

  // ✅ Get last scan sessions for dashboard
  async listSessions({ userId }) {
    await this.security.assertAllowed("mediaCleaner:listSessions", { userId });
    const sessions = await this.storage.listSessions({ userId });
    return { ok: true, sessions };
  }

  // ✅ Award WebCoins (optional gamification)
  async rewardCleanup({ userId, sessionId, freedBytes = 0 }) {
    await this.security.assertAllowed("mediaCleaner:rewardCleanup", { userId, sessionId });

    // Example: 1 coin per 500MB (configurable)
    const coins = Math.max(0, Math.floor(freedBytes / (500 * 1024 * 1024)));

    if (coins > 0) {
      await this.chain.mintWebCoins({
        userId,
        amount: coins,
        reason: "MediaCleaner cleanup reward",
        meta: { sessionId, freedBytes },
      });
    }

    return { ok: true, coinsAwarded: coins };
  }
}