import { renderTemplate } from "../renderTemplate.js";

export const AiPromptStep = {
  type: "ai.prompt",
  async execute(config, ctx) {
    const model = config.model || "gpt";
    const promptTemplate = config.promptTemplate || "";

    const prompt = renderTemplate(promptTemplate, {
      input: ctx.input,
      results: ctx.results
    });

    // MVP: без реального вызова модели
    // Потом подключим provider и вернём реальный completion
    return {
      ok: true,
      model,
      prompt,
      note: "MVP: provider call not connected yet"
    };
  }
};
