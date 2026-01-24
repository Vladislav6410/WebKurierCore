// engine/agents/telemetry/telemetry-bridge.js
// WebKurier Telemetry Bridge: ESP32 discovery + logging + terminal commands
// Node.js >= 18

import fs from "fs";
import path from "path";
import os from "os";
import http from "http";

let WS = null;
try {
  // optional: npm i ws
  const mod = await import("ws");
  WS = mod.default;
} catch {
  WS = null;
}

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, "engine", "logs", "telemetry");
const LATEST_JSON = path.join(LOG_DIR, "latest.json");
const EVENTS_JSONL = path.join(LOG_DIR, "events.jsonl");
const STATE_JSON = path.join(LOG_DIR, "bridge_state.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeHost(host) {
  if (!host) return "";
  const h = String(host).trim().replace(/\/+$/, "");
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  return `http://${h}`;
}

function httpGetJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const parsed = safeJsonParse(data);
        if (!parsed) return reject(new Error("Invalid JSON"));
        resolve(parsed);
      });
    });
    req.on("timeout", () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
  });
}

function httpPostJson(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(JSON.stringify(body || {}), "utf8");
    const u = new URL(url);

    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + (u.search || ""),
        method: "POST",
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const parsed = safeJsonParse(data);
          if (!parsed) return reject(new Error("Invalid JSON"));
          resolve(parsed);
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function getLocalSubnets24() {
  const ifaces = os.networkInterfaces();
  const subnets = new Set();

  for (const list of Object.values(ifaces)) {
    for (const iface of (list || [])) {
      if (!iface || iface.family !== "IPv4" || iface.internal) continue;
      const parts = iface.address.split(".");
      if (parts.length === 4) subnets.add(parts.slice(0, 3).join("."));
    }
  }
  return [...subnets];
}

function appendEvent(evt) {
  ensureDir(LOG_DIR);
  fs.appendFileSync(EVENTS_JSONL, JSON.stringify(evt) + "\n", "utf8");
  fs.writeFileSync(LATEST_JSON, JSON.stringify(evt, null, 2), "utf8");
}

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_JSON, "utf8");
    return safeJsonParse(raw) || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  ensureDir(LOG_DIR);
  fs.writeFileSync(STATE_JSON, JSON.stringify(state, null, 2), "utf8");
}

function rssiLabel(rssi) {
  if (typeof rssi !== "number") return "—";
  if (rssi >= -60) return "сильный ✅";
  if (rssi >= -75) return "нормальный 🟡";
  if (rssi >= -85) return "слабый 🟠";
  return "очень слабый 🔴";
}

function msToTime(ms) {
  if (typeof ms !== "number") return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}ч ${m}м ${ss}с`;
}

function terminalLine(data) {
  const net = data?.net || {};
  const sys = data?.sys || {};
  const batt = data?.battery || {};
  const io = data?.io || {};

  const ip = net.ip || "—";
  const rssi = (typeof net.rssi === "number") ? `${net.rssi}dBm` : "—";
  const v = (typeof batt.voltage === "number" && batt.voltage > 0) ? `${batt.voltage.toFixed(2)}V` : "—";
  const relay = (io.relay_state === 1) ? "ON" : "OFF";
  const up = msToTime(sys.uptime_ms);

  return `📡 ${data.device_id || "esp32"} | IP ${ip} | RSSI ${rssi} (${rssiLabel(net.rssi)}) | Batt ${v} | Relay ${relay} | Up ${up}`;
}

async function scanSubnet(subnet, from, to, concurrency, timeoutMs, healthPath) {
  const found = [];
  let i = from;

  const workers = new Array(concurrency).fill(0).map(async () => {
    while (i <= to) {
      const last = i++;
      const host = `http://${subnet}.${last}`;
      try {
        const health = await httpGetJson(`${host}${healthPath}`, timeoutMs);
        if (health?.ok) found.push(host);
      } catch { /* ignore */ }
    }
  });

  await Promise.all(workers);
  return found;
}

const DEFAULTS = {
  esp32Host: "",
  httpHealthPath: "/health",
  httpStatusPath: "/status",
  wsPort: 81,
  pollMs: 2000,

  scan: {
    enabled: true,
    subnets: [],
    from: 2,
    to: 254,
    concurrency: 60,
    timeoutMs: 700,
  },

  live: {
    printEveryMs: 1000,
  },
};

const Persisted = loadState();

const Runtime = {
  config: { ...DEFAULTS, ...(Persisted.config || {}) },
  currentHost: Persisted.currentHost ? normalizeHost(Persisted.currentHost) : "",
  ws: null,
  stopSignal: { stopped: true },
  liveEnabled: false,
  lastPrintAt: 0,
};

function persist() {
  saveState({
    config: Runtime.config,
    currentHost: Runtime.currentHost,
    savedAt: nowIso(),
  });
}

async function ensureHost() {
  // 1) current host
  if (Runtime.currentHost) {
    try {
      const h = normalizeHost(Runtime.currentHost);
      const health = await httpGetJson(`${h}${Runtime.config.httpHealthPath}`, 900);
      if (health?.ok) return h;
    } catch { /* ignore */ }
  }

  // 2) config host
  if (Runtime.config.esp32Host) {
    try {
      const h = normalizeHost(Runtime.config.esp32Host);
      const health = await httpGetJson(`${h}${Runtime.config.httpHealthPath}`, 900);
      if (health?.ok) {
        Runtime.currentHost = h;
        persist();
        return h;
      }
    } catch { /* ignore */ }
  }

  // 3) scan
  if (!Runtime.config.scan.enabled) return "";

  const subnets = (Runtime.config.scan.subnets && Runtime.config.scan.subnets.length)
    ? Runtime.config.scan.subnets
    : getLocalSubnets24();

  for (const s of subnets) {
    const hits = await scanSubnet(
      s,
      Runtime.config.scan.from,
      Runtime.config.scan.to,
      Runtime.config.scan.concurrency,
      Runtime.config.scan.timeoutMs,
      Runtime.config.httpHealthPath
    );

    if (hits.length) {
      Runtime.currentHost = hits[0];
      Runtime.config.esp32Host = hits[0];
      persist();
      return hits[0];
    }
  }

  return "";
}

function onEvent(evt) {
  appendEvent(evt);

  if (Runtime.liveEnabled && evt.type === "status") {
    const now = Date.now();
    if (now - Runtime.lastPrintAt >= Runtime.config.live.printEveryMs) {
      Runtime.lastPrintAt = now;
      // eslint-disable-next-line no-console
      console.log(terminalLine(evt.data));
    }
  }
}

async function startWs(host) {
  if (!WS) return null;

  const wsUrl = host.replace(/^http/, "ws") + `:${Runtime.config.wsPort}/`;
  const ws = new WS(wsUrl);

  ws.on("open", () => onEvent({ type: "ws_open", ts: nowIso(), host, wsUrl }));
  ws.on("close", () => onEvent({ type: "ws_close", ts: nowIso(), host }));
  ws.on("error", (e) => onEvent({ type: "ws_error", ts: nowIso(), host, error: e?.message || String(e) }));

  ws.on("message", (buf) => {
    const data = safeJsonParse(buf.toString("utf8"));
    if (!data) return;
    onEvent({ type: "status", ts: nowIso(), host, via: "ws", data });
  });

  return ws;
}

async function httpPoll(host) {
  while (!Runtime.stopSignal.stopped) {
    try {
      const data = await httpGetJson(`${host}${Runtime.config.httpStatusPath}`, 1200);
      onEvent({ type: "status", ts: nowIso(), host, via: "http", data });
    } catch (e) {
      onEvent({ type: "poll_error", ts: nowIso(), host, error: e?.message || String(e) });
    }
    await sleep(Runtime.config.pollMs);
  }
}

export const TelemetryBridge = {
  register(terminal) {
    terminal.registerCommand("/telemetry", async (argsLine) => {
      const reply = await this.handleCommand(argsLine);
      terminal.print(reply);
    });
  },

  async scan() {
    const host = await ensureHost();
    return host
      ? { ok: true, selected: host, logDir: LOG_DIR }
      : { ok: false, error: "ESP32_not_found", hint: "Try: /telemetry sethost http://192.168.1.50" };
  },

  async status() {
    const host = await ensureHost();
    if (!host) return { ok: false, error: "ESP32_not_found" };

    try {
      const data = await httpGetJson(`${host}${Runtime.config.httpStatusPath}`, 1200);
      appendEvent({ type: "status", ts: nowIso(), host, via: "http", data });
      return {
        ok: true,
        host,
        line: terminalLine(data),
        data,
        files: { latest: LATEST_JSON, events: EVENTS_JSONL },
      };
    } catch (e) {
      appendEvent({ type: "status_error", ts: nowIso(), host, error: e?.message || String(e) });
      return { ok: false, host, error: e?.message || String(e) };
    }
  },

  async startLive() {
    const host = await ensureHost();
    if (!host) return { ok: false, error: "ESP32_not_found" };

    await this.stop();

    Runtime.liveEnabled = true;
    Runtime.stopSignal = { stopped: false };

    if (WS) {
      Runtime.ws = await startWs(host);
    } else {
      Runtime.ws = null;
      onEvent({ type: "ws_missing", ts: nowIso(), host, hint: "Install: npm i ws" });
    }

    httpPoll(host);

    return {
      ok: true,
      host,
      ws: Boolean(Runtime.ws),
      logDir: LOG_DIR,
      message: "Live mode started. Use /telemetry stop to stop.",
    };
  },

  async stop() {
    Runtime.liveEnabled = false;
    Runtime.stopSignal.stopped = true;

    if (Runtime.ws) {
      try { Runtime.ws.close(); } catch { /* ignore */ }
      Runtime.ws = null;
    }
    return { ok: true, message: "Live mode stopped." };
  },

  async relay(value) {
    const host = await ensureHost();
    if (!host) return { ok: false, error: "ESP32_not_found" };

    try {
      const data = await httpPostJson(`${host}/relay`, { value: value ? 1 : 0 }, 1200);
      appendEvent({ type: "relay", ts: nowIso(), host, value: value ? 1 : 0, reply: data });
      return { ok: true, host, value: value ? 1 : 0, reply: data };
    } catch (e) {
      appendEvent({ type: "relay_error", ts: nowIso(), host, error: e?.message || String(e) });
      return { ok: false, host, error: e?.message || String(e) };
    }
  },

  setHost(host) {
    const h = normalizeHost(host);
    Runtime.currentHost = h;
    Runtime.config.esp32Host = h;
    persist();
    return { ok: true, host: h };
  },

  async handleCommand(argsLine) {
    const parts = String(argsLine || "").trim().split(/\s+/).filter(Boolean);
    const sub = (parts[0] || "").toLowerCase();

    if (!sub || sub === "help") {
      return [
        "📡 /telemetry commands:",
        "• /telemetry scan                 — auto find ESP32 in LAN",
        "• /telemetry sethost <http://ip>  — set ESP32 host manually",
        "• /telemetry status               — get current /status",
        "• /telemetry live                 — live stream + logs",
        "• /telemetry stop                 — stop live mode",
        "• /telemetry relay on|off         — control relay via /relay",
        "",
        `Logs: ${LOG_DIR}`,
      ].join("\n");
    }

    if (sub === "scan") return this.scan();
    if (sub === "status") return this.status();
    if (sub === "live") return this.startLive();
    if (sub === "stop") return this.stop();

    if (sub === "sethost") {
      const host = parts[1] || "";
      if (!host) return "❗ Usage: /telemetry sethost http://192.168.1.50";
      return this.setHost(host);
    }

    if (sub === "relay") {
      const v = (parts[1] || "").toLowerCase();
      if (v !== "on" && v !== "off") return "❗ Usage: /telemetry relay on|off";
      return this.relay(v === "on" ? 1 : 0);
    }

    return `Unknown /telemetry subcommand: ${sub}. Try: /telemetry help`;
  },
};

// init
ensureDir(LOG_DIR);
persist();