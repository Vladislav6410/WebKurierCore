import { MODEL_MAP } from "./models.map.js";
import { OpenAIProvider } from "./providers/openai.js";
import { QwenProvider } from "./providers/qwen.js";

/**
 * Provider registry.
 * IMPORTANT: keys must come from ENV or from Security/Chain proxy.
 */
function buildProviders() {
  const providers = {};

  if (process.env.OPENAI_API_KEY) {
    providers.openai = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
    });
  }

  if (process.env.QWEN_API_KEY && process.env.QWEN_BASE_URL) {
    providers.qwen = new QwenProvider({
      apiKey: process.env.QWEN_API_KEY,
      baseUrl: process.env.QWEN_BASE_URL,
    });
  }

  return providers;
}

// Map "logical model name" -> provider + real model id
const MODEL_REGISTRY = {
  // OpenAI
  "gpt-5": { provider: "openai", model: "gpt-5" },

  // Qwen3
  "qwen3-coder": { provider: "qwen", model: "qwen3-coder" },
  "qwen3-coder-flash": { provider: "qwen", model: "qwen3-coder-flash" },
  "qwen3-max": { provider: "qwen", model: "qwen3-max" },

  "qwen3-vl-32b": { provider: "qwen", model: "qwen3-vl-32b" },
  "qwen3-vl-30b-a3b": { provider: "qwen", model: "qwen3-vl-30b-a3b" },
  "qwen3-vl-235b-a22b": { provider: "qwen", model: "qwen3-vl-235b-a22b" },

  "qwen3-omni-flash": { provider: "qwen", model: "qwen3-omni-flash" },
  "qwen3-next-80b-a3b": { provider: "qwen", model: "qwen3-next-80b-a3b" },

  // Qwen2.5
  "qwen2.5-max": { provider: "qwen", model: "qwen2.5-max" },
  "qwen2.5-plus": { provider: "qwen", model: "qwen2.5-plus" },
  "qwen2.5-turbo": { provider: "qwen", model: "qwen2.5-turbo" },
  "qwen2.5-14b-instruct-1m": { provider: "qwen", model: "qwen2.5-14b-instruct-1m" },
  "qwen2.5-72b-instruct": { provider: "qwen", model: "qwen2.5-72b-instruct" },

  // Reasoning / Vision
  "qwq-32b": { provider: "qwen", model: "qwq-32b" },
  "qvq-max": { provider: "qwen", model: "qvq-max" },

  // Claude (если подключишь позже через отдельный провайдер)
  "claude-3.5": { provider: "anthropic", model: "claude-3.5" },
};

export class LLMRouter {
  constructor() {
    this.providers = buildProviders();
  }

  pickModel(agent, task = "default") {
    const profile = MODEL_MAP[agent] || {};
    return profile[task] || profile.default || "qwen3-max";
  }

  async chat({ agent, task, messages, temperature }) {
    const logical = this.pickModel(agent, task);
    const entry = MODEL_REGISTRY[logical];
    if (!entry) throw new Error(`Unknown model: ${logical}`);

    const provider = this.providers[entry.provider];
    if (!provider) throw new Error(`Provider not configured: ${entry.provider}`);

    return provider.chat({
      model: entry.model,
      messages,
      temperature,
      meta: { agent, task, logical },
    });
  }
}