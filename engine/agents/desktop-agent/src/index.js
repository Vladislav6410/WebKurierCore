import { createServer } from "./receiver/server.js";
import { logger } from "./utils/logger.js";
import { startTaskRunner } from "./jobs/taskRunner.js";

const host = process.env.WDA_HOST || "0.0.0.0";
const port = Number(process.env.WDA_PORT || 8787);

const app = await createServer();

// background tasks
startTaskRunner();

app.listen(port, host, () => {
  logger.info({ host, port }, "WebKurier Desktop Agent started");
});