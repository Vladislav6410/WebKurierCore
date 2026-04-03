import { TRUST_LEVEL } from "./taskflow-types.js";

function defaultPolicy() {
  return {
    allow: true,
    reason: "Allowed by default policy",
    riskLevel: "low"
  };
}

/**
 * Здесь должна быть интеграция с WebKurierSecurity.
 * Пока сделан локальный guard, который потом легко заменить на API вызов.
 */
export async function evaluateStepSecurity(task, step) {
  const trust = step.trustLevel || TRUST_LEVEL.UNTRUSTED;

  if (trust === TRUST_LEVEL.UNTRUSTED && step.action === "shell.exec") {
    return {
      allow: false,
      reason: "Untrusted layer cannot execute shell commands",
      riskLevel: "high"
    };
  }

  if (step.requiresSecrets === true && trust !== TRUST_LEVEL.TRUSTED) {
    return {
      allow: false,
      reason: "Only trusted steps may access secrets",
      riskLevel: "high"
    };
  }

  if (step.domain === "chain" && trust === TRUST_LEVEL.UNTRUSTED) {
    return {
      allow: false,
      reason: "Chain access denied for untrusted steps",
      riskLevel: "critical"
    };
  }

  return defaultPolicy();
}