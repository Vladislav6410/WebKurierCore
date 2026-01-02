/**
 * Minimal HTTP client for workflow steps (Node 18+ fetch).
 *
 * Безопасность:
 * - URL должен быть проверен Security gate ДО вызова fetch
 * - Таймаут по умолчанию
 * - Лимит размера ответа (maxBytes)
 * - Возвращает headers/status + body (text/json)
 */

function toHeadersObject(headers) {
  const obj = {};
  for (const [k, v] of headers.entries()) obj[k.toLowerCase()] = v;
  return obj;
}

async function readWithLimit(response, maxBytes) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    // fallback: response.text()
    const t = await response.text();
    const size = Buffer.byteLength(t, "utf8");
    if (size > maxBytes) throw new Error(`Response too large: ${size} bytes (limit ${maxBytes})`);
    return Buffer.from(t, "utf8");
  }

  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error(`Response too large: ${total} bytes (limit ${maxBytes})`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

export async function httpRequest({
  method = "GET",
  url,
  headers = {},
  body = null,
  timeoutMs = 15000,
  maxBytes = 1024 * 1024, // 1MB
  parse = "auto" // auto | json | text | bytes
}) {
  if (!url) throw new Error("httpRequest: url is required");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const opts = {
      method,
      headers,
      signal: controller.signal
    };

    if (body !== null && body !== undefined) {
      // body can be string/object/buffer
      if (Buffer.isBuffer(body)) {
        opts.body = body;
      } else if (typeof body === "string") {
        opts.body = body;
      } else {
        // object -> json
        opts.body = JSON.stringify(body);
        if (!opts.headers["content-type"] && !opts.headers["Content-Type"]) {
          opts.headers["content-type"] = "application/json; charset=utf-8";
        }
      }
    }

    const res = await fetch(url, opts);

    const headersObj = toHeadersObject(res.headers);
    const buf = await readWithLimit(res, maxBytes);

    const contentType = (headersObj["content-type"] || "").toLowerCase();

    let parsedBody = null;
    if (parse === "bytes") {
      parsedBody = buf;
    } else if (parse === "text") {
      parsedBody = buf.toString("utf8");
    } else if (parse === "json") {
      parsedBody = JSON.parse(buf.toString("utf8"));
    } else {
      // auto
      if (contentType.includes("application/json")) {
        try {
          parsedBody = JSON.parse(buf.toString("utf8"));
        } catch {
          parsedBody = buf.toString("utf8");
        }
      } else {
        parsedBody = buf.toString("utf8");
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: headersObj,
      contentType,
      body: parsedBody
    };
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error(`HTTP timeout after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}