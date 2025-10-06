import { Router } from 'express';
import normalize from '../middleware/normalize.js';
import { routeToAgent } from '../services/agent.js';
import { track } from '../services/events.js';
const r = Router();

r.post('/ingest', async (req,res)=>{
  const evt = normalize(req.body);            // TG/WA → единый формат
  const reply = await routeToAgent(evt);      // вызов нужного агента
  await track({ event: 'message_processed', ...evt });
  res.json({ reply });
});

export default r;