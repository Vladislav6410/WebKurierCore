import express from "express";
import { DronePlannerAgent } from "../agents/droneplanner/droneplanner-agent.js";
import { Geo } from "../agents/droneplanner/geo.js";
import { toQGCPlan } from "../agents/droneplanner/qgc-export.js";

const router = express.Router();
const agent = new DronePlannerAgent({ geo: Geo });

router.post("/droneplanner/plan", (req, res) => {
  try {
    const mission = agent.planMission(req.body);
    res.json(mission);
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

/**
 * POST /api/droneplanner/export/qgc
 * Body = same as /plan
 * Returns downloadable .plan JSON
 */
router.post("/droneplanner/export/qgc", (req, res) => {
  try {
    const mission = agent.planMission(req.body);
    const plan = toQGCPlan(mission, { addRTL: true });

    const filename = `WK_Mission_${new Date().toISOString().replace(/[:.]/g, "-")}.plan`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(plan, null, 2));
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

export default router;