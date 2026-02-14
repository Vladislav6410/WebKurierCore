/**
 * QGroundControl .plan exporter (MVP)
 * Converts our mission format:
 *   { mission: { waypoints:[{lat,lon,alt_m,speed_mps}] }, meta:{...} }
 * into QGC plan JSON.
 *
 * Notes:
 * - Uses simple MAVLink mission items:
 *   - TAKEOFF (22)
 *   - WAYPOINT (16)
 *   - (optional) RTL (20)
 * - Assumes global frame (WGS84).
 */

function qgcItem({ seq, command, lat, lon, alt, params = [0, 0, 0, 0] }) {
  return {
    autoContinue: true,
    command,
    doJumpId: seq,
    frame: 3, // MAV_FRAME_GLOBAL_RELATIVE_ALT
    params: [params[0], params[1], params[2], params[3], lat, lon, alt],
    type: "SimpleItem"
  };
}

export function toQGCPlan(missionJson, options = {}) {
  const {
    home = null, // {lat, lon, alt_m}
    addRTL = true
  } = options;

  const wps = missionJson?.mission?.waypoints || [];
  if (!Array.isArray(wps) || wps.length < 2) {
    throw new Error("Mission has no waypoints to export.");
  }

  const homePos = home || { lat: wps[0].lat, lon: wps[0].lon, alt_m: 0 };

  let seq = 1;
  const items = [];

  // TAKEOFF at first point altitude
  const takeoffAlt = wps[0].alt_m ?? 50;
  items.push(
    qgcItem({
      seq: seq++,
      command: 22, // MAV_CMD_NAV_TAKEOFF
      lat: wps[0].lat,
      lon: wps[0].lon,
      alt: takeoffAlt,
      params: [0, 0, 0, 0]
    })
  );

  // WAYPOINTS
  for (let i = 0; i < wps.length; i++) {
    const p = wps[i];
    items.push(
      qgcItem({
        seq: seq++,
        command: 16, // MAV_CMD_NAV_WAYPOINT
        lat: p.lat,
        lon: p.lon,
        alt: p.alt_m ?? takeoffAlt,
        params: [0, 0, 0, 0]
      })
    );
  }

  // RTL
  if (addRTL) {
    items.push(
      qgcItem({
        seq: seq++,
        command: 20, // MAV_CMD_NAV_RETURN_TO_LAUNCH
        lat: homePos.lat,
        lon: homePos.lon,
        alt: homePos.alt_m ?? 0,
        params: [0, 0, 0, 0]
      })
    );
  }

  // QGC Plan structure
  const plan = {
    fileType: "Plan",
    groundStation: "QGroundControl",
    version: 1,
    mission: {
      cruiseSpeed: missionJson?.meta?.speed_mps ?? 10,
      firmwareType: 12, // generic (PX4 often 12); can be adjusted later
      hoverSpeed: 5,
      items,
      plannedHomePosition: [homePos.lat, homePos.lon, homePos.alt_m ?? 0],
      vehicleType: 2, // 2 = multirotor (ok for MVP)
      version: 2
    },
    geoFence: {
      circles: [],
      polygons: [],
      version: 2
    },
    rallyPoints: {
      points: [],
      version: 2
    }
  };

  return plan;
}