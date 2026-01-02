export const WebhookTrigger = {
  type: "webhook",
  async start(config, onRun) {
    // Реальное биндинг-API будет в backend/api.
    // Здесь только контракт.
    return { ok: true, path: config.path || "/api/hooks/:workflowId" };
  }
};