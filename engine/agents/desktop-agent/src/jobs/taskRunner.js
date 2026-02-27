import { loadTasks } from "./jobStore.js";
import { runExecutor } from "../executors/shellCmd.js";
import { logger } from "../utils/logger.js";

/**
 * Simple scheduler: checks tasks every 30s.
 * Task format:
 * { taskId, everySec, jobTemplate }
 */
export function startTaskRunner() {
  setInterval(async () => {
    const tasks = loadTasks();
    const now = Date.now();

    for (const t of tasks) {
      if (!t.everySec) continue;
      if (!t._nextRun) t._nextRun = now + (t.everySec * 1000);
      if (now < t._nextRun) continue;

      t._nextRun = now + (t.everySec * 1000);

      const job = {
        ...t.jobTemplate,
        jobId: `task_${t.taskId}_${Date.now()}`,
        ts: Date.now()
      };

      try {
        logger.info({ taskId: t.taskId, action: job.action }, "Running background task");
        await runExecutor(job, t.jobTemplate.profile || "readonly_repo");
      } catch (e) {
        logger.warn({ taskId: t.taskId, err: String(e) }, "Background task failed");
      }
    }
  }, 30_000);
}