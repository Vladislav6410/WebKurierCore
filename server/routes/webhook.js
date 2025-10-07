import { Router } from 'express';
import normalize from '../middleware/normalize.js';
import { routeToAgent } from '../services/agent.js';
import { track } from '../services/events.js';

// импортируем из единого файла агента (romantic); можно обобщить позже
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const unified = await import(path.resolve(__dirname, '../../engine/agents/romantic/tools/feedback_unified.js'));
const { appendFeedback } = unified;

const r = Router();

r.post('/ingest', async (req,res)=>{
  const evt = normalize(req.body);

  if (evt?.event === 'feedback_submitted') {
    const ok = await appendFeedback(
      evt.agent || 'romantic',
      evt.payload?.type || 'stories',
      evt.payload?.text || ''
    );
    await track({ event:'feedback_enqueued', ok, ...evt });
    return res.json({ ok });
  }

  const reply = await routeToAgent(evt);
  await track({ event:'message_processed', ...evt });
  res.json({ reply });
});

export default r;