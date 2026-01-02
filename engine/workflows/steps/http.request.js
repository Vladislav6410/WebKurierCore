import { validateExternalUrl } from "../securityGate.js";
import { httpRequest } from "../httpClient.js";
import { renderTemplate } from "../renderTemplate.js";

function normalizeHeaders(h) {
  if (!h) return {};
  if (typeof h !== "object") throw new Error("http.request: headers must be object");
  const out = {};
  for (const [k, v] of Object.entries(h)) out[k] = String(v);
  return out;
}

export const HttpRequestStep = {
  type: "http.request",
  async execute(config, ctx) {
    const method = (config.method || "GET").toUpperCase();
    const urlRaw = config.url;

    if (!urlRaw) throw new Error("http.request: config.url is required");

    // allow templating: {{input.xxx}} / {{results.step.yyy}}
    const url = renderTemplate(urlRaw, { input: ctx.input, results: ctx.results });

    // ✅ Security gate must approve
    validateExternalUrl(url, ctx.workflow.policies || {});

    const headers = normalizeHeaders(config.headers);
    const timeoutMs = Number(config.timeoutMs ?? 15000);
    const maxBytes = Number(config.maxBytes ?? 1024 * 1024);
    const parse = config.parse || "auto";

    let body = config.body ?? null;
    if (typeof body === "string") {
      body = renderTemplate(body, { input: ctx.input, results: ctx.results });
    } else if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
      // allow templating inside string fields of object (shallow)
      const shallow = {};
      for (const [k, v] of Object.entries(body)) {
        shallow[k] = typeof v === "string" ? renderTemplate(v, { input: ctx.input, results: ctx.results }) : v;
      }
      body = shallow;
    }

    const res = await httpRequest({
      method,
      url,
      headers,
      body,
      timeoutMs,
      maxBytes,
      parse
    });

    return {
      ok: true,
      request: { method, url, timeoutMs, maxBytes, parse },
      response: {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        contentType: res.contentType,
        body: res.body
      }
    };
  }
};
