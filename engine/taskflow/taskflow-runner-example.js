import fs from "fs/promises";
import path from "path";
import { createTaskFlow, runTaskFlow } from "./index.js";

async function main() {
  const skillPath = path.resolve("engine/taskflow/skills/drone-survey.skill.json");
  const raw = await fs.readFile(skillPath, "utf-8");
  const payload = JSON.parse(raw);

  payload.context = {
    ...payload.context,
    coordinates: [51.962, 7.625],
    gsdCmPx: 2.5,
    overlapFront: 80,
    overlapSide: 70
  };

  const task = await createTaskFlow(payload);
  const result = await runTaskFlow(task.taskId);

  console.log("TASK RESULT:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});