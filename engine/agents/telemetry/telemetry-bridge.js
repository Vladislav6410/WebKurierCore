// engine/agents/telemetry/telemetry-bridge.js
// WebKurier Telemetry Bridge: ESP32 discovery + logging + terminal integration
// Node.js >= 18 recommended

import fs from "fs";
import path from "path";
import os from "os";
import http from "http";
import { fileURLToPath } from "url";

// Optional dependencies (recommended):
//   npm i ws mdns-js
// If not installed, bridge will fallback to HTTP polling only.
let WS;
let mdns;
try { WS = (await import("ws")).default; } catch { WS = null; }
try { mdns = await import("mdns-js"); } catch { mdns = null; }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------- Paths -------------------------
const ROOT = process.cwd(); // run from WebKurierCore root
const LOG_DIR = path.join(ROOT, "engine", "logs", "telemetry");
const LATEST_JSON = path.join(LOG_DIR, "latest.json");
const EVENTS_JSONL = path.join(LOG_DIR, "events.jsonl");
const STATE_JSON = path.join(LOG_DIR, "bridge_state.json");

// ------------------------- Defaults -------------------------
const DEFAULTS = {
  // Candidate subnets for scan (edit if needed)
  scan: {
    enabled: true,
    // If empty => auto-detect local /24 subnets
    subnets: [],
    // scan range (last octet)
    from: 2,
    to: 254,
    // concurrency limit
    concurrency: 60,
    // request timeout
    timeoutMs: 700,
  },

  // Preferred host (if set, bridge uses it first)
  esp32Host: "", // e.g. "http://192.168.1.50"

  // Endpoints (match your ESP32 firmware)
  httpStatusPath: "/status",
  httpHealthPath: "/health",

  // WebSocket port (firmware uses 81)
  wsPort: 81,

  // Polling (used if WS unavailable)
  pollMs: 2000,

  // Terminal live mode
  live: {
    enabled: true,
    // throttle printing to terminal (ms)
    printEveryMs: 1000,
  },

  // mDNS discovery name (optional)
  mdns: {
    enabled: true,
    // if your firmware doesn't advertise, you can still use scan
    hostnames: ["webkurier-telemetry.local", "telemetry-esp32.local"],
  },
};

// ------------------------- Utilities -------------------------
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

function getLocalSubnets24() {
  // returns array like ["192.168.1", "10.0.0"]
  const ifaces = os.networkInterfaces();
  const subnets = new Set();

  for (const [name, list] of Object.entries(ifaces)) {
    for (const iface of (list || [])) {
      if (!iface || iface.family !== "IPv4" || iface.internal) continue;
      const ip = iface.address; // x.x.x.x
      const parts = ip.split(".");
      if (parts.length === 4) subnets.add(parts.slice(0, 3).join("."));
    }
  }
  return [...subnets];
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
    req.on("timeout", () => {
      req.destroy(new Error("Timeout"));
    });
    req.on("error", reject);
  });
}

function normalizeHost(host) {
  if (!host) return "";
  if (host.startsWith("http://") || host.startsWith("https://")) return host.replace(/\/+$/, "");
  return `http://${host}`.replace(/\/+$/, "");
}

// ------------------------- Bridge state -------------------------
function loadState() {
  try {
    const raw = fs.readFileSync(STATE_JSON, "utf-8");
    const s = safeJsonParse(raw);
    return s || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  ensureDir(LOG_DIR);
  fs.writeFileSync(STATE_JSON, JSON.stringify(state, null, 2), "utf-8");
}

function appendEvent(obj) {
  ensureDir(LOG_DIR);
  fs.appendFileSync(EVENTS_JSONL, JSON.stringify(obj) + "\n", "utf-8");
  fs.writeFileSync(LATEST_JSON, JSON.stringify(obj, null, 2), "utf-8");
}

// ------------------------- Discovery -------------------------
async function resolveMdnsHostnames(hostnames, timeoutMs = 1200) {
  // Tries to resolve via DNS by doing HTTP /health quickly.
  // If mdns-js installed: also listens for mdns answers (best-effort).
  const found = [];

  // 1) Quick attempt via /health
  for (const hn of hostnames) {
    const host = normalizeHost(hn);
    try {
      const health = await httpGetJson(`${host}${DEFAULTS.httpHealthPath}`, timeoutMs);
      if (health?.ok) found.push(host);
    } catch { /* ignore */ }
  }

  // 2) Optional mdns-js browse for anything advertising
  if (mdns) {
    try {
      // Browse for any services; ESP32 often doesn't advertise, so best-effort.
      const browser = mdns.createBrowser(mdns.tcp("http"));
      const start = Date.now();

      browser.on("ready", () => browser.discover());
      browser.on("update", (data) => {
        // data: { fullname, host, addresses, port ... }
        if (!data?.addresses?.length) return;
        for (const ip of data.addresses) {
          // Try /health
          const h = normalizeHost(ip);
          // Debounce duplicates
          if (found.includes(h)) continue;
          (async () => {
            try {
              const health = await httpGetJson(`${h}${DEFAULTS.httpHealthPath}`, 500);
              if (health?.ok) found.push(h);
            } catch { /* ignore */ }
          })();
        }
      });

      while (Date.now() - start < timeoutMs) {
        await sleep(100);
      }
      browser.stop();
    } catch {
      // ignore mdns errors
    }
  }

  return [...new Set(found)];
}

async function scanSubnet(subnet, from, to, concurrency, timeoutMs) {
  // subnet: "192.168.1"
  const found = [];
  let i = from;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (i <= to) {
      const last = i++;
      const host = `http://${subnet}.${last}`;
      try {
        const health = await httpGetJson(`${host}${DEFAULTS.httpHealthPath}`, timeoutMs);
        // Our firmware returns {ok:true,...}
        if (health?.ok) found.push(host);
      } catch { /* ignore */ }
    }
  });
  await Promise.all(workers);
  return found;
}

async function discoverESP32(config) {
  const discovered = [];

  // 0) if explicit host is set — verify first
  if (config.esp32Host) {
    const h = normalizeHost(config.esp32Host);
    try {
      const health = await httpGetJson(`${h}${config.httpHealthPath}`, 900);
      if (health?.ok) return [h];
    } catch {
      // continue discovery
    }
  }

  // 1) mDNS hostnames
  if (config.mdns?.enabled) {
    const mdnsFound = await resolveMdnsHostnames(config.mdns.hostnames || [], 1200);
    discovered.push(...mdnsFound);
    if (discovered.length) return [...new Set(discovered)];
  }

  // 2) scan /24 subnets
  if (config.scan?.enabled) {
    const subnets = (config.scan.subnets && config.scan.subnets.length)
      ? config.scan.subnets
      : getLocalSubnets24();

    for (const s of subnets) {
      const hits = await scanSubnet(
        s,
        config.scan.from,
        config.scan.to,
        config.scan.concurrency,
        config.scan.timeoutMs
      );
      if (hits.length) {
        discovered.push(...hits);
        break; // stop at first subnet with matches
      }
    }
  }

  return [...new Set(discovered)];
}

// ------------------------- Live stream (WS + fallback polling) -------------------------
function formatTerminalLine(status) {
  const d = status?.data || status; // support both wrappers
  const net = d?.net || {};
  const sys = d?.sys || {};
  const batt = d?.battery || {};
  const io = d?.io || {};

  const rssi = (typeof net.rssi === "number") ? `${net.rssi}dBm` : "—";
  const ip = net.ip || "—";
  const v = (typeof batt.voltage === "number" && batt.voltage > 0) ? batt.voltage.toFixed(2) + "V" : "—";
  const relay = (io.relay_state === 1) ? "ON" : "OFF";
  const up = (typeof sys.uptime_ms === "number") ? Math.floor(sys.uptime_ms / 1000) + "s" : "—";

  return `📡 ${d.device_id || "esp32"} | IP ${ip} | RSSI ${rssi} | Batt ${v} | Relay ${relay} | Up ${up}`;
}

async function startWsClient(host, config, onStatus) {
  if (!WS) return null;

  const wsUrl = host.replace(/^http/, "ws") + `:${config.wsPort}/`;
  const ws = new WS(wsUrl);

  ws.on("open", () => {
    onStatus({ type: "ws_open", ts: nowIso(), host, wsUrl });
  });

  ws.on("message", (buf) => {
    const txt = buf.toString("utf-8");
    const data = safeJsonParse(txt);
    if (!data) return;
    onStatus({ type: "status", ts: nowIso(), host, data, via: "ws" });
  });

  ws.on("close", () => {
    onStatus({ type: "ws_close", ts: nowIso(), host });
  });

  ws.on("error", (err) => {
    onStatus({ type: "ws_error", ts: nowIso(), host, error: err?.message || String(err) });
  });

  return ws;
}

async function startHttpPoll(host, config, onStatus, stopSignal) {
  while (!stopSignal.stopped) {
    try {
      const data = await httpGetJson(`${host}${config.httpStatusPath}`, 1200);
      onStatus({ type: "status", ts: nowIso(), host, data, via: "http" });
    } catch (err) {
      onStatus({ type: "poll_error", ts: nowIso(), host, error: err?.message || String(err) });
    }
    await sleep(config.pollMs);
  }
}

// ------------------------- Terminal integration -------------------------
/*
  Expected integration patterns (choose one):

  A) If you have a central Terminal registry:
     import { registerTerminalCommand } from "...";
     registerTerminalCommand("/telemetry", handler)

  B) If your terminal calls agent methods directly:
     TelemetryBridge.handleCommand(cmd, args, ctx)

  This file exports TelemetryBridge with a handleCommand() entrypoint,
  and start()/stop()/scan()/status() methods.
*/

const BridgeState = loadState();

const Runtime = {
  config: { ...DEFAULTS, ...(BridgeState.config || {}) },
  currentHost: BridgeState.currentHost ? normalizeHost(BridgeState.currentHost) : "",
  ws: null,
  stopSignal: { stopped: true },
  lastPrintAt: 0,
  liveEnabled: false,
};

function persist() {
  saveState({
    config: Runtime.config,
    currentHost: Runtime.currentHost,
    savedAt: nowIso(),
  });
}

async function ensureConnectedHost() {
  // If currentHost is set and alive — keep it
  if (Runtime.currentHost) {
    try {
      const health = await httpGetJson(`${Runtime.currentHost}${Runtime.config.httpHealthPath}`, 900);
      if (health?.ok) return Runtime.currentHost;
    } catch { /* continue */ }
  }

  // Discover
  const candidates = await discoverESP32(Runtime.config);
  if (candidates.length) {
    Runtime.currentHost = candidates[0];
    persist();
    return Runtime.currentHost;
  }
  return "";
}

function onStatusEvent(evt) {
  // log everything useful
  appendEvent(evt);

  // print in live mode
  if (Runtime.liveEnabled && evt.type === "status") {
    const now = Date.now();
    if (now - Runtime.lastPrintAt >= Runtime.config.live.printEveryMs) {
      Runtime.lastPrintAt = now;
      console.log(formatTerminalLine(evt));
    }
  }
}

// ------------------------- Public API -------------------------
export const TelemetryBridge = {
  async scan() {
    const hits = await discoverESP32(Runtime.config);
    if (hits.length) {
      Runtime.currentHost = hits[0];
      persist();
    }
    return { ok: hits.length > 0, found: hits, selected: Runtime.currentHost || null };
  },

  async status() {
    const host = await ensureConnectedHost();
    if (!host) return { ok: false, error: "ESP32_not_found" };

    try {
      const data = await httpGetJson(`${host}${Runtime.config.httpStatusPath}`, 1200);
      const evt = { type: "status", ts: nowIso(), host, data, via: "http" };
      appendEvent(evt);
      return { ok: true, host, data };
    } catch (err) {
      const evt = { type: "status_error", ts: nowIso(), host, error: err?.message || String(err) };
      appendEvent(evt);
      return { ok: false, host, error: evt.error };
    }
  },

  async startLive() {
    const host = await ensureConnectedHost();
    if (!host) return { ok: false, error: "ESP32_not_found" };

    // Stop previous
    await this.stop();

    Runtime.liveEnabled = true;
    Runtime.stopSignal = { stopped: false };

    // Prefer WS if available
    if (WS) {
      Runtime.ws = await startWsClient(host, Runtime.config, onStatusEvent);
    }

    // Always keep HTTP poll as fallback / additional
    startHttpPoll(host, Runtime.config, onStatusEvent, Runtime.stopSignal);

    return {
      ok: true,
      host,
      ws: Boolean(Runtime.ws),
      logDir: LOG_DIR,
      hint: "Use /telemetry stop to stop live stream",
    };
  },

  async stop() {
    Runtime.liveEnabled = false;

    if (Runtime.ws) {
      try { Runtime.ws.close(); } catch { /* ignore */ }
      Runtime.ws = null;
    }

    Runtime.stopSignal.stopped = true;
    return { ok: true };
  },

  setHost(host) {
    Runtime.currentHost = normalizeHost(host);
    Runtime.config.esp32Host = Runtime.currentHost;
    persist();
    return { ok: true, host: Runtime.currentHost };
  },

  // Terminal command dispatcher
  // cmd: "/telemetry", args: ["live"] etc.
  async handleCommand(cmd, args = []) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "live") {
      const res = await this.startLive();
      return this._formatTerminalReply(res);
    }

    if (sub === "stop") {
      const res = await this.stop();
      return this._formatTerminalReply({ ...res, message: "Live mode stopped." });
    }

    if (sub === "status") {
      const res = await this.status();
      return this._formatTerminalReply(res, { prettyStatus: true });
    }

    if (sub === "scan") {
      const res = await this.scan();
      return this._formatTerminalReply(res);
    }

    if (sub === "sethost") {
      const host = args[1] || "";
      if (!host) return "❗ Usage: /telemetry sethost http://192.168.1.50";
      const res = this.setHost(host);
      return this._formatTerminalReply(res);
    }

    // help
    return [
      "📡 Telemetry Bridge commands:",
      "• /telemetry scan           — find ESP32 in local network",
      "• /telemetry sethost <url>  — set ESP32 host manually",
      "• /telemetry status         — fetch current status (/status)",
      "• /telemetry live           — live stream to terminal + log files",
      "• /telemetry stop           — stop live mode",
      "",
      `Logs: ${LOG_DIR}`,
    ].join("\n");
  },

  _formatTerminalReply(res, opts = {}) {
    if (!res || typeof res !== "object") return String(res);

    if (opts.prettyStatus && res.ok && res.data) {
      const line = formatTerminalLine(res.data);
      return [
        "✅ Telemetry status:",
        `Host: ${res.host}`,
        line,
        "",
        "Raw JSON saved to latest.json",
      ].join("\n");
    }

    return `✅ ${JSON.stringify(res, null, 2)}`;
  },
};

// Ensure log dir exists
ensureDir(LOG_DIR);
persist();