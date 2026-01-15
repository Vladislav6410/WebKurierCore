import { registerMediaCleanerRoutes } from "./routes/media-cleaner.routes.js";

export function registerAllRoutes(app, deps) {
  registerMediaCleanerRoutes(app, deps);
}