/**
 * feedback_unified.js
 * -------------------
 * ОДИН модуль для работы с фидбеком:
 *  - appendFeedback(agentKey, type, line)   → пишет в memory/feedback/<type>_new.txt
 *  - mergeAll(agentKey, { dry })            → сливает *_new.txt → prompts/*.txt (норм., дедуп, бэкап)
 *
 * Использование как модуль:
 *   import { appendFeedback, mergeAll } from 'engine/agents/romantic/tools/feedback_unified.js';
 *
 * CLI:
 *   node engine/agents/romantic/tools/feedback_unified.js           # merge romantic
 *   node engine/agents/romantic/tools/feedback_unified.js --agent romantic --dry
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const ROOT = path.resolve(CWD, 'engine', 'agents');

// --- helpers ---
function norm(s){
  return String(s || '')
    .replace(/\r/g,'')
    .replace(/\s+/g,' ')
    .replace(/\s+([,.!?…;:])/g,'$1')
    .trim();
}

async function readLines(file){
  try {
    const txt = await fs.readFile(file, 'utf8');
    return txt.split('\n').map(norm).filter(Boolean);
  } catch { return []; }
}

async function writeLines(file, lines){
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, lines.join('\n') + '\n', 'utf8');
}

async function backupFile(file, backupDir){
  try{
    const exists = await fs.readFile(file, 'utf8');
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const name = path.basename(file);
    await fs.mkdir(backupDir, { recursive:true });
    await fs.writeFile(path.join(backupDir, `${name}.${stamp}.bak`), exists, 'utf8');
  }catch{ /* no-op if file absent */ }
}

function mergeLists(base, fresh, maxLen=300){
  const seen = new Set(base.map(s => s.toLowerCase()));
  const out = [...base];
  for (const l of fresh){
    const n = l.slice(0, maxLen);
    const key = n.toLowerCase();
    if (!seen.has(key)){
      seen.add(key);
      out.push(n);
    }
  }
  out.sort((a,b)=> a.localeCompare(b,'ru') || a.localeCompare(b));
  return out;
}

// --- public API ---

/** Append one feedback line into <agent>/memory/feedback/<type>_new.txt */
export async function appendFeedback(agentKey, type, line){
  const clean = norm(line);
  if(!clean) return false;

  const dir = path.join(ROOT, agentKey, 'memory', 'feedback');
  const file = path.join(dir, `${type}_new.txt`);
  await fs.mkdir(dir, { recursive: true });

  // простая анти-дубль проверка по текущему файлу
  try {
    const buf = await fs.readFile(file, 'utf8');
    if (buf.toLowerCase().includes(clean.toLowerCase())) return false;
  } catch {}

  await fs.appendFile(file, clean + '\n', 'utf8');
  return true;
}

/** Merge all *_new.txt into prompts/*.txt with backup & dedupe */
export async function mergeAll(agentKey, { dry=false } = {}){
  const AGENT_DIR = path.join(ROOT, agentKey);
  const PROMPTS_DIR = path.join(AGENT_DIR, 'prompts');
  const FEEDBACK_DIR = path.join(AGENT_DIR, 'memory', 'feedback');
  const BACKUP_DIR = path.join(AGENT_DIR, 'backups');

  const MAP = [
    ['compliments_new.txt',   'compliments.txt'],
    ['date_ideas_new.txt',    'date_ideas.txt'],
    ['stories_new.txt',       'stories.txt'],
    ['night_stories_new.txt', 'night_stories.txt']
  ];

  let addedTotal = 0;
  for (const [srcName, dstName] of MAP){
    const src = path.join(FEEDBACK_DIR, srcName);
    const dst = path.join(PROMPTS_DIR, dstName);

    const fresh = await readLines(src);
    if (!fresh.length){
      console.log(`⏭  ${agentKey}: ${srcName} — нет новых строк`);
      continue;
    }

    const base = await readLines(dst);
    const merged = mergeLists(base, fresh);
    const added = Math.max(0, merged.length - base.length);
    addedTotal += added;

    console.log(`→ ${agentKey}: ${srcName} → ${dstName}: +${added} (итого ${merged.length})`);

    if (!dry){
      await backupFile(dst, BACKUP_DIR);
      await writeLines(dst, merged);
      await fs.writeFile(src, '', 'utf8'); // очистить _new
    }
  }
  console.log(dry ? `🧪 DRY-RUN завершён.` : `✅ ${agentKey}: добавлено ~${addedTotal} строк.`);
  return addedTotal;
}

// --- CLI entrypoint ---
if (import.meta.url === `file://${process.argv[1]}`){
  const args = new Map(process.argv.slice(2).map(x=>{
    const [k,v] = x.startsWith('--') ? x.replace(/^--/,'').split('=') : [x, true];
    return [k, v===undefined?true:v];
  }));
  const agent = (args.get('agent') || 'romantic').toString();
  const dry = args.has('dry');

  mergeAll(agent, { dry }).catch(e=>{
    console.error('❌ merge error:', e);
    process.exit(1);
  });
}