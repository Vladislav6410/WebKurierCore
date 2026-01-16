// api/openai-client.js
// Minimal OpenAI client wrapper (MVP)
//
// Uses official OpenAI Node SDK.
// Provides a small, stable surface for CodexAgent.
//
// ENV required:
// - OPENAI_API_KEY
//
// Optional:
// - OPENAI_CODEX_MODEL (default: "gpt-5.2-codex")

let cachedOpenAI = null;

async function getOpenAI(fetchFn = null) {
  if (cachedOpenAI) return cachedOpenAI;

  // Dynamic import to keep ESM clean
  const mod = await import("openai");
  const OpenAI = mod.default || mod.OpenAI || mod;

  // Prefer provided fetch, else use global fetch, else undici
  let f = fetchFn || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) {
    const undici = await import("undici");
    f = undici.fetch;
  }

  cachedOpenAI = { OpenAI, fetch: f };
  return cachedOpenAI;
}

/**
 * Create OpenAI client.
 * @param {object} params
 * @param {string} params.apiKey
 * @param {function|null} [params.fetchFn]
 */
export async function createOpenAIClient({ apiKey, fetchFn = null }) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required (server-side only)");
  }

  const { OpenAI, fetch } = await getOpenAI(fetchFn);

  const client = new OpenAI({
    apiKey,
    fetch,
  });

  const model = process.env.OPENAI_CODEX_MODEL || "gpt-5.2-codex";

  return {
    model,

    /**
     * Thin wrapper around Responses API.
     * @param {object} payload - OpenAI Responses API payload
     */
    async responsesCreate(payload) {
      return client.responses.create(payload);
    },
  };
}