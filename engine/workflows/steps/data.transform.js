export const DataTransformStep = {
  type: "data.transform",
  async execute(config, ctx) {
    // config: { expression: "({ ... })" }
    const fn = new Function("input", "results", `return (${config.expression});`);
    return fn(ctx.input, ctx.results);
  }
};