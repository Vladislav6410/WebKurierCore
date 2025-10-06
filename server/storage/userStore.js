import { promises as fs } from 'node:fs';
import path from 'node:path';
const base = path.resolve('engine/agents'); // per-agent папки

export async function readUser(agentKey, id){
  try{
    const p = path.join(base, agentKey, 'memory', 'users', id+'.json');
    const j = await fs.readFile(p,'utf8'); return JSON.parse(j);
  }catch{
    return { profile:{}, preferences:{}, relationship:{}, history:[], billing:{plan:'free'} };
  }
}
export async function writeUser(agentKey, id, data){
  const dir = path.join(base, agentKey, 'memory', 'users');
  await fs.mkdir(dir, { recursive:true });
  await fs.writeFile(path.join(dir, id+'.json'), JSON.stringify(data,null,2));
}