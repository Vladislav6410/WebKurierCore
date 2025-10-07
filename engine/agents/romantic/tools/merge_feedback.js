/**
 * merge_feedback.js (enhanced)
 * ----------------------------
 * Объединяет memory/feedback/*_new.txt → prompts/*.txt
 * + нормализация, дедуп, сортировка, бэкап, --dry
 *
 * Запуск:
 *   node engine/agents/romantic/tools/merge_feedback.js
 *   node engine/agents/romantic/tools/merge_feedback.js --dry   # только показать изменения
 */

import { promises as fs } from 'fs';
import path from 'path';

const AGENT_DIR = path.resolve('engine/agents/romantic');
const PROMPTS_DIR = path.join(AGENT_DIR, 'prompts');
const FEEDBACK_DIR = path.join(AGENT_DIR, 'memory', 'feedback');
const BACKUP_DIR = path.join(AGENT_DIR, 'backups');
const DRY = process.argv.includes('--dry');

const MAP = [
  ['compliments_new.txt',   'compliments.txt'],
  ['date_ideas_new.txt',    'date_ideas.txt'],
  ['stories_new.txt',       'stories.txt'],
  ['night_stories_new.txt', 'night_stories.txt']
];

const MAX_LEN = 300; // защита от случайных простыней

function normalizeLine(s){
  return (s || '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?…;:])/g, '$1')
    .trim();
}

async function readLines(file){
  try {
    const txt = await fs.readFile(file, 'utf8');
    return txt.split('\n').map(normalizeLine).filter(Boolean);
  } catch { return []; }
}

async function writeLines(file, lines){
  await fs.mkdir(path.dirname(file), { recursive:true });
  await fs.writeFile(file, lines.join('\n') + '\n', 'utf8');
}

async function backupFile(file){
  try{
    const exists = await fs.readFile(file, 'utf8');
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const name = path.basename(file);
    await fs.mkdir(BACKUP_DIR, { recursive:true });
    await fs.writeFile(path.join(BACKUP_DIR, `${name}.${stamp}.bak`), exists, 'utf8');
  }catch{ /* no-op */ }
}

function merge(base, fresh){
  // дедуп кейс-инсensitive + нормализация
  const seen = new Set(base.map(s => s.toLowerCase()));
  const out = [...base];
  for (const l of fresh){
    const n = l.slice(0, MAX_LEN);
    const key = n.toLowerCase();
    if (!seen.has(key)){
      seen.add(key);
      out.push(n);
    }
  }
  // алфавитная сортировка по-русски, потом по-умолчанию
  out.sort((a,b)=> a.localeCompare(b,'ru') || a.localeCompare(b));
  return out;
}

(async ()=>{
  let addedTotal = 0;
  for (const [srcName, dstName] of MAP){
    const src = path.join(FEEDBACK_DIR, srcName);
    const dst = path.join(PROMPTS_DIR, dstName);

    const fresh = await readLines(src);
    if (!fresh.length){
      console.log(`⏭  ${srcName} — нет новых строк`);
      continue;
    }

    const base = await readLines(dst);
    const merged = merge(base, fresh);
    const added = Math.max(0, merged.length - base.length);
    addedTotal += added;

    console.log(`→ ${srcName} → ${dstName}: +${added} (итого ${merged.length})`);

    if (!DRY){
      await backupFile(dst);
      await writeLines(dst, merged);
      // очищаем источник
      await fs.writeFile(src, '', 'utf8');
    }
  }
  console.log(DRY ? `🧪 DRY-RUN завершён.` : `✅ Готово. Добавлено ~${addedTotal} строк.`);
})().catch(e=>{ console.error('❌ Ошибка merge_feedback:', e); process.exit(1); });