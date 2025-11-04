const fs = require('fs');
const path = require('path');
const { checkRelayWorkflow, restartRelayWorkflow } = require('./tools/relay-connector');
const { parseGitHubEvent } = require('./tools/github-parser');

class MonitoringAgent {
  constructor() {
    this.paths = {
      history: path.join(__dirname, 'memory/error-history.json'),
      log:     path.join(__dirname, '../../logs/relay-errors.log'),
      cfg:     path.join(__dirname, 'config.json'),
    };
    this.relayApiKey  = process.env.RELAY_API_KEY;
    this.githubToken  = process.env.GITHUB_TOKEN;
    this.repo         = process.env.GITHUB_REPO;
    this.workflowId   = process.env.RELAY_WORKFLOW_ID;
    this.ensureFiles();
  }

  ensureFiles() {
    const dir = path.dirname(this.paths.history);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.paths.history)) fs.writeFileSync(this.paths.history, '[]');
    const logDir = path.dirname(this.paths.log);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  }

  log(line) {
    fs.appendFileSync(this.paths.log, `[${new Date().toISOString()}] ${line}\n`);
  }

  // 1) Обработка вебхука GitHub
  async handleGitHubEvent({ event, payload }) {
    const info = parseGitHubEvent(event, payload);
    if (!info) return;
    if (info.severity === 'info') return; // игнорим шум
    await this.logError(info);
    if (info.severity === 'critical') await this.autoFix(info.type);
  }

  // 2) Периодическая проверка Relay
  async checkRelayWorkflows() {
    const status = await checkRelayWorkflow({
      apiKey: this.relayApiKey,
      workflowId: this.workflowId
    });
    if (status.ok) return true;

    const err = { 
      source: 'relay',
      type: status.type || 'relay_unknown',
      message: status.message || 'Relay failed',
      severity: status.severity || 'warning'
    };
    await this.logError(err);
    if (err.severity === 'critical') await this.autoFix(err.type);
    return false;
  }

  async logError(error) {
    this.log(`ERROR [${error.source}] ${error.type} :: ${error.message}`);
    const history = JSON.parse(fs.readFileSync(this.paths.history, 'utf-8'));
    history.push({ ts: Date.now(), ...error });
    fs.writeFileSync(this.paths.history, JSON.stringify(history.slice(-500), null, 2));
  }

  async autoFix(errorType) {
    // Пример правил
    if (errorType.startsWith('openai_')) {
      // переключаем ключ и перезапускаем воркфлоу
      process.env.OPENAI_API_KEY = process.env.OPENAI_FALLBACK_KEY || process.env.OPENAI_API_KEY;
      this.log('AutoFix: switched to OPENAI_FALLBACK_KEY');
      await restartRelayWorkflow({
        apiKey: this.relayApiKey,
        workflowId: this.workflowId,
        overrides: { enable_search: false }
      });
      this.log('AutoFix: relay workflow restarted without search');
    }
  }
}

module.exports = MonitoringAgent;