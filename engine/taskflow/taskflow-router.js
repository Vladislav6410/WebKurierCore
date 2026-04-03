/**
 * Здесь Core только маршрутизирует.
 * Доменные действия выполняют соответствующие модули.
 */

async function invokeDrone(step, context) {
  return {
    ok: true,
    domain: "dronehybrid",
    message: `Drone task executed: ${step.action}`,
    input: step.input || {},
    context
  };
}

async function invokePhoneCore(step, context) {
  return {
    ok: true,
    domain: "phonecore",
    message: `PhoneCore task executed: ${step.action}`,
    input: step.input || {},
    context
  };
}

async function invokeChain(step, context) {
  return {
    ok: true,
    domain: "chain",
    message: `Chain action executed: ${step.action}`,
    input: step.input || {},
    context
  };
}

async function invokeSecurity(step, context) {
  return {
    ok: true,
    domain: "security",
    message: `Security action executed: ${step.action}`,
    input: step.input || {},
    context
  };
}

async function invokeCore(step, context) {
  return {
    ok: true,
    domain: "core",
    message: `Core action executed: ${step.action}`,
    input: step.input || {},
    context
  };
}

export async function routeTaskStep(step, context = {}) {
  switch (step.domain) {
    case "dronehybrid":
      return invokeDrone(step, context);

    case "phonecore":
      return invokePhoneCore(step, context);

    case "chain":
      return invokeChain(step, context);

    case "security":
      return invokeSecurity(step, context);

    case "core":
    default:
      return invokeCore(step, context);
  }
}