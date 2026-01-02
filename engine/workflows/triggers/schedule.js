export const ScheduleTrigger = {
  type: "schedule",
  async start(config, onRun) {
    // Реальная cron-обвязка будет в backend (node-cron / systemd timer / celery beat).
    return { ok: true, cron: config.cron || "0 * * * *" };
  }
};