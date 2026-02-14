import express from "express";
import { DronePlannerAgent } from "../agents/droneplanner/droneplanner-agent.js";
import { Geo } from "../agents/droneplanner/geo.js";

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

export default router;