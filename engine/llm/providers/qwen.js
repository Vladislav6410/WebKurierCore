import { LLMProvider } from "./base.js";

export class QwenProvider extends LLMProvider {
  constructor({ apiKey, baseUrl }) {
    super({ name: "qwen" });
    this.apiKey = apiKey;
    this.baseUrl = baseUrl; // например OpenAI-compatible endpoint
  }

  async chat({ model, messages, temperature = 0.2 }) {
    if (!this.baseUrl) throw new Error("QwenProvider: baseUrl is required");

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
      throw new Error(`QwenProvider error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return {
      text: data?.choices?.[0]?.message?.content ?? "",
      raw: data,
    };
  }
}