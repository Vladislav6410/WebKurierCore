/**
 * merge_feedback.js
 * ------------------
 * Скрипт объединяет новые фразы из memory/feedback/ с основными prompts/.
 * Дубликаты удаляются, результат сохраняется обратно в prompts.
 *
 * Запуск:
 *    node tools/merge_feedback.js
 */

import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'engine/agents/romantic');
const promptsDir = path.join(root, 'prompts');
const feedbackDir = path.join(root, 'memory', 'feedback');

const files = [
  'compliments',
  'date_ideas',
  'stories',
  'night_stories'
];

files.forEach((base) => {
  const mainFile = path.join(promptsDir, `${base}.txt`);
  const feedbackFile = path.join(feedbackDir, `${base}_new.txt`);

  if (!fs.existsSync(feedbackFile)) return;

  const main = fs.existsSync(mainFile)
    ? fs.readFileSync(mainFile, 'utf-8').split('\n').filter(Boolean)
    : [];
  const newLines = fs.readFileSync(feedbackFile, 'utf-8').split('\n').filter(Boolean);

  if (newLines.length === 0) return;

  const merged = Array.from(new Set([...main, ...newLines])).filter(Boolean);
  fs.writeFileSync(mainFile, merged.join('\n'), 'utf-8');
  fs.writeFileSync(feedbackFile, '', 'utf-8'); // очистка файла после слияния

  console.log(`✅ ${base}.txt обновлён: добавлено ${newLines.length} новых строк`);
});

console.log('✨ Слияние завершено.');