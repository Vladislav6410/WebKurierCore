export const AiPromptStep = {
  type: "ai.prompt",
  async execute(config, ctx) {
    // Заглушка: реальный вызов модели будет через твой AI layer.
    // config: { model, promptTemplate }
    const template = config.promptTemplate || "";
    return {
      ok: true,
      model: config.model || "gpt",
      promptTemplate: template,
      note: "Implement provider call in Core AI layer; store usage for limits"
    };
  }
};