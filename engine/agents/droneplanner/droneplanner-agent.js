/**
 * WebKurierCore — DronePlannerAgent (MVP)
 * - принимает AOI (GeoJSON Polygon) + параметры съёмки
 * - считает площадь
 * - генерирует сетку линий (простая lawnmower)
 * - отдаёт mission.json (waypoints)
 */

export class DronePlannerAgent {
  constructor({ geo }) {
    this.geo = geo; // helper methods injected
  }

  planMission(input) {
    const {
      aoi,                 // GeoJSON Feature(Polygon)
      camera = { sensor_width_mm: 13.2, focal_length_mm: 8.8, image_w_px: 5472, image_h_px: 3648 },
      gsd_cm = 3,          // target GSD
      overlap = { front: 0.75, side: 0.65 },
      speed_mps = 10,
      heading_deg = 0
    } = input;

    const area_m2 = this.geo.areaM2(aoi);
    const bbox = this.geo.bbox(aoi);

    // altitude from GSD (very simplified pinhole model)
    // GSD = (H * sensor_width) / (focal_length * image_width)
    // H = GSD * f * image_width / sensor_width
    const gsd_m = gsd_cm / 100.0;
    const altitude_m =
      (gsd_m * camera.focal_length_mm * camera.image_w_px) / camera.sensor_width_mm;

    // ground footprint width (approx)
    const footprint_w_m = (altitude_m * camera.sensor_width_mm) / camera.focal_length_mm;
    const line_spacing_m = footprint_w_m * (1 - overlap.side);

    // photo interval by front overlap (approx, using footprint height)
    const sensor_h_mm = camera.sensor_width_mm * (camera.image_h_px / camera.image_w_px);
    const footprint_h_m = (altitude_m * sensor_h_mm) / camera.focal_length_mm;
    const along_step_m = footprint_h_m * (1 - overlap.front);
    const photo_interval_s = Math.max(0.5, along_step_m / speed_mps);

    const lines = this.geo.lawnmowerLines(aoi, line_spacing_m, heading_deg);
    const waypoints = this.geo.linesToWaypoints(lines, { altitude_m, speed_mps });

    return {
      meta: {
        created_at: new Date().toISOString(),
        area_m2,
        area_km2: area_m2 / 1e6,
        bbox,
        altitude_m,
        line_spacing_m,
        photo_interval_s,
        overlap,
        speed_mps,
        heading_deg
      },
      mission: {
        frame: "WGS84",
        waypoints
      }
    };
  }
}