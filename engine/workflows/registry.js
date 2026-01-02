export function createRegistry() {
  const triggers = new Map();
  const steps = new Map();

  return {
    registerTrigger(type, impl) {
      triggers.set(type, impl);
    },
    registerStep(type, impl) {
      steps.set(type, impl);
    },

    getTrigger(type) {
      if (!triggers.has(type)) throw new Error(`Unknown trigger: ${type}`);
      return triggers.get(type);
    },
    getStep(type) {
      if (!steps.has(type)) throw new Error(`Unknown step: ${type}`);
      return steps.get(type);
    }
  };
}