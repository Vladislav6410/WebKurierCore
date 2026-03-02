import { signJob } from "../../integrations/wda/job-signer.js";
import { sendJobToWDA } from "../../integrations/wda/wda-client.js";

export function registerProgrammerRoutes(app) {
  // Apply unified diff через WDA (как patch ops, либо как git apply внутри sandbox)
  app.post("/api/programmer/apply_patch", async (req, res) => {
    try {
      const { target = "WebKurierCore", unifiedDiff = "" } = req.body || {};
      if (!unifiedDiff || unifiedDiff.length < 10) {
        return res.status(400).json({ ok: false, error: "unifiedDiff empty" });
      }

      const job = signJob({
        jobId: `prog_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        ts: Date.now(),
        requester: { telegramId: "", userId: "webpanel" },
        action: "patch_apply_unified",
        target,
        args: { unifiedDiff }
      });

      const r = await sendJobToWDA(job);
      return res.json({ ok: true, wda: r });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // Run tests/build via WDA
  app.post("/api/programmer/run", async (req, res) => {
    try {
      const { target = "WebKurierCore", kind = "tests" } = req.body || {};
      const action = (kind === "lint") ? "lint" : (kind === "build") ? "build" : "tests";

      const job = signJob({
        jobId: `run_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        ts: Date.now(),
        requester: { telegramId: "", userId: "webpanel" },
        action,
        target,
        args: {}
      });

      const r = await sendJobToWDA(job);
      return res.json({ ok: true, wda: r });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // Tree check via WDA
  app.post("/api/programmer/tree_check", async (req, res) => {
    try {
      const { target = "WebKurierCore" } = req.body || {};
      const job = signJob({
        jobId: `tree_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        ts: Date.now(),
        requester: { telegramId: "", userId: "webpanel" },
        action: "repo_tree_check",
        target,
        args: {}
      });

      const r = await sendJobToWDA(job);
      return res.json({ ok: true, wda: r });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });
}