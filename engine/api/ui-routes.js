import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerUiRoutes(app) {
  // /ui/media-cleaner -> dashboard
  app.get("/ui/media-cleaner", (req, res) => {
    const filePath = path.join(
      __dirname,
      "..",
      "agents",
      "media-cleaner",
      "ui",
      "media-cleaner-core.html"
    );
    res.sendFile(filePath);
  });

  // serve the JS module next to HTML
  app.get("/ui/media-cleaner/media-cleaner-ui.js", (req, res) => {
    const filePath = path.join(
      __dirname,
      "..",
      "agents",
      "media-cleaner",
      "ui",
      "media-cleaner-ui.js"
    );
    res.type("text/javascript").sendFile(filePath);
  });
}