import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import webhook from './routes/webhook.js';
import { exec } from 'node:child_process';
import translatorGptRouter from '../api/translator-gpt.js'; // новый GPT-переводчик

const app = express();
app.use(cors()); // разрешаем запросы из браузера/Core UI
app.use(bodyParser.json({ limit: '1mb', limit: '1mb' }));
app.use('/webhook', webhook);
app.use('/api', translatorGptRouter); // GPT теперь доступен под /api/translator/gpt
app.get('/health', (_req, res) => res.json({ ok: true, service: 'core', ts: Date.now() }));

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`API up on :${PORT}`));

const MIN = Number(process.env.MERGE_INTERVAL_MIN || 60);
const AGENT = process.env.MERGE_AGENT || 'romantic';

function runMerge() {
  const cmd = `node engine/agents/${AGENT}/tools/feedback_unified.js --agent=${AGENT}`;
  console.log(`[merge] run for ${AGENT}: ${cmd}`);
  exec(cmd, (err, out, errout) => {
    if (err) console.error('[merge] error:', err.message);
    if (out) console.log(out.trim());
    if (errout) console.error(errout.trim());
  });
}

if (MIN > 0) {
  if (process.env.MERGE_RUN_ON_START !== '0') runMerge();
  setInterval(runMerge, MIN * 60 * 1000);
}