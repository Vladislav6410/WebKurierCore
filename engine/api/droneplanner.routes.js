import express from "express";
import { DronePlannerAgent } from "../agents/droneplanner/droneplanner-agent.js";
import { Geo } from "../agents/droneplanner/geo.js";
import { toQGCPlan } from "../agents/droneplanner/qgc-export.js";
import { geoFenceFromAOI } from "../agents/droneplanner/qgc-geofence.js";

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

/**
 * POST /api/droneplanner/export/qgc-geofence
 * Body = same as /plan
 * Returns .plan with GeoFence generated from AOI
 */
router.post("/droneplanner/export/qgc-geofence", (req, res) => {
  try {
    const mission = agent.planMission(req.body);
    const plan = toQGCPlan(mission, { addRTL: true });

    // Inject GeoFence from AOI
    plan.geoFence = geoFenceFromAOI(req.body.aoi);

    const filename = `WK_Mission_GeoFence_${new Date().toISOString().replace(/[:.]/g, "-")}.plan`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(plan, null, 2));
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

export default router;


