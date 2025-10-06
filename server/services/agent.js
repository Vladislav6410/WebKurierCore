import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUser, writeUser } from '../storage/userStore.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function routeToAgent(evt){
  const agentKey = evt.agent;                        // напр. "romantic"
  const userId = evt.user.id.replace(/[:+]/g,'_');

  const { handle } = await import(path.join(
    __dirname, `../../engine/agents/${agentKey}/adapter.js`)
  );                                                // тонкий адаптер агента

  const state = await readUser(agentKey, userId);
  const { reply, nextState } = await handle({ evt, state });
  await writeUser(agentKey, userId, nextState);
  return reply;
}