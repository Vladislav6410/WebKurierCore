export const HttpRequestStep = {
  type: "http.request",
  async execute(config, ctx) {
    // ВАЖНО: перед реальным fetch нужно валидировать URL через WebKurierSecurity.
    return {
      ok: true,
      method: config.method || "GET",
      url: config.url,
      headers: config.headers || {},
      body: config.body || null,
      note: "Implement fetch AFTER Security URL validation"
    };
  }
};