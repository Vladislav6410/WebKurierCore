/**
 * Build QGC geofence polygon from AOI GeoJSON Polygon Feature.
 * QGC expects:
 * geoFence: { polygons:[{ inclusion:true, polygon:[{lat,lon}, ...] }], circles:[], version:2 }
 */

export function geoFenceFromAOI(aoiFeature) {
  if (!aoiFeature || aoiFeature.type !== "Feature") {
    throw new Error("AOI must be a GeoJSON Feature.");
  }
  const geom = aoiFeature.geometry;
  if (!geom || geom.type !== "Polygon") {
    throw new Error("AOI geometry must be Polygon.");
  }

  const ring = geom.coordinates?.[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    throw new Error("AOI polygon ring is invalid.");
  }

  // Convert [lon,lat] -> {lat,lon}
  const polygon = ring.map(([lon, lat]) => ({ lat, lon }));

  // Ensure ring closed (QGC usually tolerates, but we enforce)
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  if (first.lat !== last.lat || first.lon !== last.lon) {
    polygon.push({ ...first });
  }

  return {
    circles: [],
    polygons: [
      {
        inclusion: true, // inclusion fence (stay inside)
        polygon
      }
    ],
    version: 2
  };
}