import { LLMProvider } from "./base.js";

export class OpenAIProvider extends LLMProvider {
  constructor({ apiKey, baseUrl }) {
    super({ name: "openai" });
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://api.openai.com/v1";
  }

  async chat({ model, messages, temperature = 0.2 }) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAIProvider error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return {
      text: data?.choices?.[0]?.message?.content ?? "",
      raw: data,
    };
  }
}