const express = require("express");
const path = require("path");
const EngineerAgent = require("../engineer-agent");

const router = express.Router();

const agent = new EngineerAgent({
  rootDir: path.join(__dirname, "..")
});

router.get("/health", (req, res) => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  res.json({
    ok: true,
    agent: "engineer",
    enabled: true,
    hasOpenAIKey: hasKey,
    model: agent.model
  });
});

router.post("/run", async (req, res) => {
  try {
    const result = await agent.runTask(req.body || {});
    if (!result.ok) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("[Engineer API] run error:", error);
    res.status(500).json({
      ok: false,
      agent: "engineer",
      error: error.message || "Unknown error"
    });
  }
});

module.exports = router;