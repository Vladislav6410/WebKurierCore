export const ManualTrigger = {
  type: "manual",
  async start(config, onRun) {
    // В UI/терминале вызываешь onRun(input)
    return { ok: true, hint: "Call onRun(input) from UI/terminal" };
  }
};