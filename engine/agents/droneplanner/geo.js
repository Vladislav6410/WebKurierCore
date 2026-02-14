/**
 * Geo helpers (MVP)
 * NOTE: this is intentionally simple. Replace with turf.js later.
 */

export const Geo = {
  bbox(feature) {
    const coords = feature.geometry.coordinates.flat(2);
    let west = 180, east = -180, south = 90, north = -90;
    for (let i = 0; i < coords.length; i += 2) {
      const lon = coords[i], lat = coords[i + 1];
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    }
    return { west, south, east, north };
  },

  // rough planar area (ok for small AOI); swap to turf.area for real
  areaM2(feature) {
    const ring = feature.geometry.coordinates[0];
    // equirectangular projection around centroid
    const c = ring.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]).map(x => x / ring.length);
    const R = 6378137;
    const toXY = ([lon, lat]) => {
      const x = (lon - c[0]) * Math.PI / 180 * R * Math.cos(c[1] * Math.PI / 180);
      const y = (lat - c[1]) * Math.PI / 180 * R;
      return [x, y];
    };
    const pts = ring.map(toXY);
    let area = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    }
    return Math.abs(area) / 2;
  },

  // generates parallel lines across bbox (MVP), clipped later
  lawnmowerLines(feature, spacing_m, heading_deg) {
    // MVP: ignores heading/clipping; returns vertical lines in bbox
    const b = this.bbox(feature);
    // approx meters per degree lon/lat around center
    const lat0 = (b.south + b.north) / 2;
    const mPerDegLat = 111320;
    const mPerDegLon = 111320 * Math.cos(lat0 * Math.PI / 180);

    const width_m = (b.east - b.west) * mPerDegLon;
    const n = Math.max(1, Math.floor(width_m / spacing_m));

    const lines = [];
    for (let i = 0; i <= n; i++) {
      const lon = b.west + (i / n) * (b.east - b.west);
      lines.push([
        [lon, b.south],
        [lon, b.north]
      ]);
    }
    return lines;
  },

  linesToWaypoints(lines, { altitude_m, speed_mps }) {
    const wps = [];
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = (i % 2 === 0) ? lines[i] : [...lines[i]].reverse();
      for (const [lon, lat] of line) {
        wps.push({
          id: ++idx,
          lat,
          lon,
          alt_m: altitude_m,
          speed_mps
        });
      }
    }
    return wps;
  }
};