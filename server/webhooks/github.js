const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const LOG = path.join(__dirname, '../../engine/logs/relay-errors.log');
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(req) {
  const signature = req.get('X-Hub-Signature-256') || '';
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  return signature === `sha256=${hmac}`;
}

router.post('/webhook/github', express.json({ type: '*/*' }), async (req, res) => {
  try {
    if (!verifySignature(req)) return res.status(401).send('Invalid signature');

    const event = req.get('X-GitHub-Event');
    const payload = req.body;

    // Интересующие события
    const interesting = [
      'workflow_run', 'check_run', 'issues', 'issue_comment',
      'deployment_status', 'repository_vulnerability_alert', 'push'
    ];
    if (!interesting.includes(event)) return res.status(200).send('Ignored');

    // Сохраняем как сырой лог
    fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${event} ${payload?.action || ''}\n`);

    // Передаём агенту на обработку
    const MonitoringAgent = require('../../engine/agents/monitoring/monitoring-agent');
    const agent = new MonitoringAgent();
    await agent.handleGitHubEvent({ event, payload });

    return res.status(200).send('OK');
  } catch (e) {
    fs.appendFileSync(LOG, `[${new Date().toISOString()}] webhook-error ${e.message}\n`);
    return res.status(500).send('Server error');
  }
});

module.exports = router;