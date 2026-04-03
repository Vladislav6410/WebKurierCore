export const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
});

export const STEP_STATUS = Object.freeze({
  PENDING: "pending",
  READY: "ready",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
  BLOCKED: "blocked"
});

export const TRUST_LEVEL = Object.freeze({
  TRUSTED: "trusted",
  SEMI_TRUSTED: "semi_trusted",
  UNTRUSTED: "untrusted"
});

export const DOMAIN = Object.freeze({
  CORE: "core",
  PHONECORE: "phonecore",
  DRONE: "dronehybrid",
  CHAIN: "chain",
  SECURITY: "security"
});