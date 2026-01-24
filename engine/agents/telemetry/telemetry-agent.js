// engine/agents/telemetry/telemetry-agent.js
// WebKurier TelemetryAgent — Live ESP32 Telemetry via HTTP

export const TelemetryAgent = {
  // ⚙️ Настройки подключения (меняешь IP на свой ESP32)
  config: {
    esp32Host: "http://192.168.1.50", // <-- ВАЖНО: сюда IP ESP32 из Serial Monitor
    pollMs: 2000,
    autoPoll: true
  },

  state: {
    lastStatus: null,
    pollTimer: null
  },

  // -------------------------
  // UI actions
  // -------------------------
  async getStatus() {
    try {
      const data = await this._fetchJSON(`${this.config.esp32Host}/status`);
      this.state.lastStatus = data;

      const pretty = this._formatStatus(data);
      this._output(pretty);
    } catch (err) {
      this._output(this._formatError("Не удалось получить статус", err));
    }
  },

  async diagnostics() {
    try {
      const data = await this._fetchJSON(`${this.config.esp32Host}/status`);
      this.state.lastStatus = data;

      const report = this._formatDiagnostics(data);
      this._output(report);
    } catch (err) {
      this._output(this._formatError("Диагностика недоступна", err));
    }
  },

  async relayOn() {
    await this._setRelay(1);
  },

  async relayOff() {
    await this._setRelay(0);
  },

  startAuto() {
    if (this.state.pollTimer) return;

    this.config.autoPoll = true;
    this._output("⏳ Автообновление включено…");

    this.state.pollTimer = setInterval(() => {
      this.getStatus();
    }, this.config.pollMs);

    // первый запрос сразу
    this.getStatus();
  },

  stopAuto() {
    this.config.autoPoll = false;

    if (this.state.pollTimer) {
      clearInterval(this.state.pollTimer);
      this.state.pollTimer = null;
    }

    this._output("⛔ Автообновление выключено.");
  },

  // -------------------------
  // Internal helpers
  // -------------------------
  async _setRelay(value) {
    try {
      const res = await this._postJSON(`${this.config.esp32Host}/relay`, { value });
      const msg = value ? "🔌 Реле включено ✅" : "🔌 Реле выключено ✅";

      // обновим статус после команды
      await this.getStatus();

      this._output(`${msg}\n\n${this._formatMiniReply(res)}`);
    } catch (err) {
      this._output(this._formatError("Ошибка управления реле", err));
    }
  },

  async _fetchJSON(url) {
    const r = await fetch(url, { method: "GET" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  },

  async _postJSON(url, body) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  },

  _formatStatus(d) {
    // ожидаем структуру прошивки ESP32, которую я дал ранее
    const net = d?.net || {};
    const sys = d?.sys || {};
    const batt = d?.battery || {};
    const io = d?.io || {};

    const rssi = Number.isFinite(net.rssi) ? `${net.rssi} dBm` : "—";
    const signalLabel = this._rssiToLabel(net.rssi);

    const voltage = (typeof batt.voltage === "number" && batt.voltage > 0)
      ? `${batt.voltage.toFixed(2)} V`
      : "—";

    const relay = (io.relay_state === 1) ? "✅ ON" : "⛔ OFF";

    return `
📡 WebKurier Telemetry (ESP32)

🧩 Device: ${d.device_id || "—"}
🔖 FW: ${d.name || "—"} ${d.version || ""}

🌐 Network:
• Mode: ${net.mode || "—"}
• SSID: ${net.ssid || "—"}
• IP: ${net.ip || "—"}
• RSSI: ${rssi} (${signalLabel})

🖥 System:
• Uptime: ${this._msToTime(sys.uptime_ms)}
• Free heap: ${sys.free_heap || "—"} bytes
• Chip: ${sys.chip_id || "—"}

🔋 Battery:
• Voltage: ${voltage}

🔌 IO:
• Relay (${io.relay_pin ?? "—"}): ${relay}
    `.trim();
  },

  _formatDiagnostics(d) {
    const net = d?.net || {};
    const sys = d?.sys || {};
    const batt = d?.battery || {};
    const io = d?.io || {};

    const issues = [];

    // простые критерии
    if (typeof net.rssi === "number" && net.rssi < -80) issues.push("📶 Слабый сигнал Wi-Fi (RSSI < -80 dBm)");
    if (typeof sys.free_heap === "number" && sys.free_heap < 40000) issues.push("🧠 Мало памяти (heap < 40 KB)");
    if (typeof batt.voltage === "number" && batt.voltage > 0 && batt.voltage < 3.4) issues.push("🔋 Низкое напряжение батареи (< 3.4V)");

    const ok = issues.length === 0;

    const lines = issues.length
      ? issues.map(i => `• ${i}`).join("\n")
      : "• Всё стабильно ✅";

    return `
🧪 Диагностика ESP32

✅ Связь: ${net.ip ? "OK" : "нет IP"}
✅ Wi-Fi: ${this._rssiToLabel(net.rssi)}
✅ Реле: ${(io.relay_state === 1 || io.relay_state === 0) ? "OK" : "—"}

📋 Итог:
${ok ? "🟢 Система в норме" : "🟠 Есть замечания"}

⚠️ Детали:
${lines}
    `.trim();
  },

  _formatMiniReply(res) {
    if (!res || typeof res !== "object") return "";
    return `📨 Ответ ESP32: ${JSON.stringify(res)}`;
  },

  _formatError(title, err) {
    return `
❌ ${title}
Причина: ${err?.message || err}
Проверь:
• ESP32 в той же Wi-Fi сети
• правильный IP в telemetry-agent.js (config.esp32Host)
• открывается ли: http://IP/status
    `.trim();
  },

  _rssiToLabel(rssi) {
    if (typeof rssi !== "number") return "—";
    if (rssi >= -60) return "сильный ✅";
    if (rssi >= -75) return "нормальный 🟡";
    if (rssi >= -85) return "слабый 🟠";
    return "очень слабый 🔴";
  },

  _msToTime(ms) {
    if (typeof ms !== "number") return "—";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}ч ${m}м ${ss}с`;
  },

  _output(text) {
    const el = document.getElementById("output");
    if (el) el.innerText = text;
    else console.warn("❗ #output не найден");
  }
};

// Автозапуск если включено (удобно для “живого” экрана)
window.TelemetryAgent = TelemetryAgent;