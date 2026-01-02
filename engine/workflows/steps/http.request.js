import { validateExternalUrl } from "../securityGate.js";

export const HttpRequestStep = {
  type: "http.request",
  async execute(config, ctx) {
    const method = config.method || "GET";
    const url = config.url;

    if (!url) throw new Error("http.request: config.url is required");

    // ✅ validate URL via Security gate
    validateExternalUrl(url, ctx.workflow.policies || {});

    // MVP: пока без настоящего fetch (следующий шаг = HTTP fetch)
    return {
      ok: true,
      method,
      url,
      headers: config.headers || {},
      body: config.body || null,
      note: "URL validated by Security gate. Next step: implement real fetch."
    };
  }
};
