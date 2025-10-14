/**
 * ai-copilot.js
 * Node.js модуль "ИИ-второй пилот" для дрона / наземной станции
 *
 * Основные возможности:
 * - Принимает телеметрию (MQTT / WebSocket / TCP)
 * - Поддержка MAVLink через MAVSDK (если доступно)
 * - Простая логика "guardian angel": предупреждения, автозависание, автопосадка
 * - Плагины: vision (stub), audio (TTS alerts), safety rules
 * - Шаблон для интеграции с heavy-inference (Python/TensorRT) через gRPC / child_process
 *
 * Usage:
 * 1) Поместить в engine/agents/copilot/
 * 2) npm install (см. package.json ниже)
 * 3) Запуск: NODE_ENV=production node ai-copilot.js
 *
 * IMPORTANT: Этот файл — шаблон. Подключи реальные сенсоры / модели в соответствующие места.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');
const mqtt = require('mqtt'); // lightweight telemetry transport
const say = require('say');   // TTS для быстрых аудио-уведомлений (можно заменить на локальный TTS)

const CONFIG_PATH = path.join(__dirname, 'config.json');

/* ==========================
   1) Config & defaults
   ========================== */
let config = {
  mqtt: {
    url: 'mqtt://localhost:1883',
    telemetryTopic: 'drone/telemetry',
    commandTopic: 'drone/commands',
    qos: 1
  },
  safety: {
    minBattery: 18,           // % — ниже -> land
    minAltitudeForRTH: 5,     // m
    maxWindSpeed: 10,         // m/s (пример)
    obstacleDistanceThreshold: 3.0, // m — ближе -> evasive
    obstacleCountThreshold: 1
  },
  autopilot: {
    engageAutolandOnCritical: true
  },
  voice: {
    enabled: true,
    voiceLocale: 'ru' // language hint for TTS
  },
  mode: 'hybrid' // 'onboard' or 'ground' or 'hybrid'
};

// load config.json if exists
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const c = JSON.parse(fs.readFileSync(CONFIG_PATH));
    config = {...config, ...c};
    console.log('[copilot] loaded config.json');
  } else {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('[copilot] created default config.json');
  }
} catch (e) {
  console.warn('[copilot] failed to read config.json, using defaults', e);
}

/* ==========================
   2) Core Event Bus
   ========================== */
class Copilot extends EventEmitter {
  constructor(cfg) {
    super();
    this.cfg = cfg;
    this.telemetry = {}; // last telemetry snapshot
    this.state = {
      armed: false,
      mode: 'READY', // READY | FLYING | RTL | LANDING | EMERGENCY
      lastWarnings: []
    };

    // simple cooldown for repeated audio alerts
    this._lastAlertTs = 0;
    this._alertCooldown = 3000; // ms
  }

  start() {
    this._setupMQTT();
    this._setupLoops();
    console.log('[copilot] started');
  }

  /* ----------------------------
     MQTT telemetry & commands
     ---------------------------- */
  _setupMQTT() {
    const mqttUrl = this.cfg.mqtt.url;
    this.client = mqtt.connect(mqttUrl);

    this.client.on('connect', () => {
      console.log('[copilot][mqtt] connected ->', mqttUrl);
      this.client.subscribe(this.cfg.mqtt.telemetryTopic, {qos: this.cfg.mqtt.qos});
      this.client.subscribe(`${this.cfg.mqtt.telemetryTopic}/vision`, {qos: this.cfg.mqtt.qos});
    });

    this.client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        this._onTelemetry(msg, topic);
      } catch (e) {
        console.warn('[copilot][mqtt] invalid message', e);
      }
    });

    this.client.on('error', (err) => {
      console.error('[copilot][mqtt] error', err);
    });

    // expose sendCommand
    this.sendCommand = (cmd) => {
      this.client.publish(this.cfg.mqtt.commandTopic, JSON.stringify(cmd), {qos: this.cfg.mqtt.qos});
    };
  }

  /* ----------------------------
     Telemetry handler
     ---------------------------- */
  _onTelemetry(msg, topic) {
    // expected telemetry: {timestamp, lat, lon, alt, vx, vy, vz, battery, wind, obstacles: [{dist, azim, elev}], sys_status}
    this.telemetry = {...this.telemetry, ...msg};
    this.emit('telemetry', this.telemetry, topic);
    this._safetyCheck(this.telemetry);
    // vision topic receives objects from vision pipeline
    if (topic.endsWith('/vision')) {
      this._onVision(msg);
    }
  }

  /* ----------------------------
     Vision events (stub)
     ---------------------------- */
  _onVision(visionMsg) {
    // visionMsg could be: {objects: [{label, score, bbox, distance}], segmentation, confidence}
    this.emit('vision', visionMsg);
    // If obstacle too close, trigger evasive actions
    if (Array.isArray(visionMsg.objects)) {
      const close = visionMsg.objects.filter(o => o.distance && o.distance < this.cfg.safety.obstacleDistanceThreshold);
      if (close.length >= this.cfg.safety.obstacleCountThreshold) {
        this._warn('Obstacle too close — evasive maneuver', {severity: 'HIGH'});
        this._evasiveManeuver(close);
      }
    }
  }

  /* ----------------------------
     Safety & Decision logic
     ---------------------------- */
  _safetyCheck(t) {
    // battery low
    if (t.battery !== undefined && t.battery < this.cfg.safety.minBattery) {
      this._warn(`Battery low: ${t.battery}% — automatic landing recommended`, {severity: 'CRITICAL'});
      if (this.cfg.autopilot.engageAutolandOnCritical) {
        this._engageAutoland('BatteryCritical');
      }
    }

    // wind too strong (example)
    if (t.wind !== undefined && t.wind > this.cfg.safety.maxWindSpeed) {
      this._warn(`Wind speed high: ${t.wind} m/s — return to home recommended`, {severity: 'HIGH'});
      this._suggestRTL();
    }

    // obstacle from telemetry sensors list
    if (Array.isArray(t.obstacles) && t.obstacles.length > 0) {
      const close = t.obstacles.filter(o => o.distance < this.cfg.safety.obstacleDistanceThreshold);
      if (close.length > 0) {
        this._warn(`Obstacle detected at ${close[0].distance.toFixed(1)} m`, {severity: 'HIGH'});
        this._evasiveManeuver(close);
      }
    }

    // simple failsafe: if no telemetry updates for some time
    const now = Date.now();
    this._lastTelemTs = now;
  }

  _warn(text, opts = {}) {
    const now = Date.now();
    const severity = opts.severity || 'INFO';
    console.log(`[copilot][WARN][${severity}]`, text);
    this.state.lastWarnings.push({ts: now, text, severity});
    // speak (TTS) if allowed and cadence permits
    if (this.cfg.voice.enabled && (now - this._lastAlertTs) > this._alertCooldown) {
      this._tts(text);
      this._lastAlertTs = now;
    }
    this.emit('warning', {text, severity});
  }

  _tts(text) {
    // simple TTS using 'say' (cross-platform), replace with local TTS engine if needed
    try {
      // choose voice / language based on config.voice.voiceLocale
      say.speak(text, null, 1.0, (err) => {
        if (err) console.error('[copilot][TTS] error', err);
      });
    } catch (e) {
      console.warn('[copilot][TTS] tts failed', e);
    }
  }

  _suggestRTL() {
    // publish suggestion to operator UI
    this.sendCommand({type: 'suggest', action: 'RTL', reason: 'WindHigh'});
  }

  _engageAutoland(reason = 'Unknown') {
    if (this.state.mode === 'LANDING' || this.state.mode === 'EMERGENCY') return;
    this.state.mode = 'LANDING';
    this.sendCommand({type: 'autoland', reason});
    this._warn(`Engaging autoland: ${reason}`, {severity: 'CRITICAL'});
  }

  _evasiveManeuver(obstacles) {
    // simple evasive logic: stop forward motion, climb a bit or hover
    // in real system — compute vector away from obstacle and issue velocity command
    this.sendCommand({type: 'maneuver', action: 'hover', details: {reason: 'obstacle'}});
    // if multiple close obstacles -> emergency land
    if (obstacles.length > 3) {
      this._warn('Multiple obstacles detected — emergency landing', {severity: 'CRITICAL'});
      this._engageAutoland('MultipleObstacles');
    }
  }

  /* ----------------------------
     Integration helpers
     ---------------------------- */

  // call heavy inference (Python) as child process (example stub)
  callHeavyVision(payloadJSON, cb) {
    // optionally implement gRPC or HTTP to reach heavy inference server
    // quick stub: spawn python script and pass JSON via stdin
    const py = spawn('python3', [path.join(__dirname, 'vision_server_stub.py')]);
    let out = '';
    let err = '';
    py.stdin.write(JSON.stringify(payloadJSON));
    py.stdin.end();
    py.stdout.on('data', (d) => { out += d.toString(); });
    py.stderr.on('data', (d) => { err += d.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
        console.warn('[copilot][vision] python exited', code, err);
        return cb(new Error('vision error'));
      }
      try {
        const res = JSON.parse(out);
        cb(null, res);
      } catch (e) {
        cb(e);
      }
    });
  }

  /* ----------------------------
     Heartbeat / loops
     ---------------------------- */
  _setupLoops() {
    // periodic health check
    setInterval(() => {
      // if telemetry missing long time -> raise alarm
      const now = Date.now();
      if (this._lastTelemTs && (now - this._lastTelemTs) > 5000) {
        this._warn('Telemetry stale >5s', {severity: 'HIGH'});
      }
      // publish copilot status
      const status = {ts: now, mode: this.state.mode, warnings: this.state.lastWarnings.slice(-5)};
      this.client.publish('drone/copilot/status', JSON.stringify(status), {qos: 0});
    }, 2000);
  }
}

/* ==========================
   3) Initialize Copilot
   ========================== */
const copilot = new Copilot(config);

copilot.on('telemetry', (t) => {
  // debug print minimal
  if (t.lat && t.lon) {
    process.stdout.write(`\r[telemetry] alt:${t.alt || 'n/a'}m batt:${t.battery || 'n/a'}% `);
  }
});

copilot.on('warning', (w) => {
  // push to logger / groundstation
  // Example: append to log file
  try {
    fs.appendFileSync(path.join(__dirname, 'copilot.log'), JSON.stringify(w) + os.EOL);
  } catch (e) { /* ignore */ }
});

// start
copilot.start();

/* expose API for other modules (if required) */
module.exports = {
  copilot,
  createCopilot: (cfg) => new Copilot(cfg || config)
};