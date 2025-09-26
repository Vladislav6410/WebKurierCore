// engine/agents/romantic/romantic-agent.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_PROMPTS = path.join(__dirname, 'prompts');
const DIR_USERS = path.join(__dirname, 'memory', 'users');
const FILE_COMPLIMENTS = path.join(DIR_PROMPTS, 'compliments.txt');

async function readLines(file) {
  try {
    const s = await fs.readFile(file, 'utf8');
    return s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export class RomanticAgent {
  constructor(opts = {}) {
    this.opts = opts;
    this.handle = this.respond; // совместимость со старыми вызовами
    this._ready = fs.mkdir(DIR_USERS, { recursive: true });
  }

  async _loadUser(userId) {
    await this._ready;
    const fp = path.join(DIR_USERS, `${userId}.json`);
    try {
      return JSON.parse(await fs.readFile(fp, 'utf8'));
    } catch {
      return {
        user_id: userId,
        lang: 'en',
        tone: 'gentle',
        likes: [],
        dislikes: [],
        favorite_phrases: [],
        flags: { safe_mode: true, allow_personalization: true },
        history: [],
        counters: { likes: 0, stories_used: 0, compliments_used: 0 },
        last_updated: new Date().toISOString()
      };
    }
  }

  async _saveUser(u) {
    u.last_updated = new Date().toISOString();
    const fp = path.join(DIR_USERS, `${u.user_id}.json`);
    await fs.writeFile(fp, JSON.stringify(u, null, 2), 'utf8');
  }

  async remember(userId, patch) {
    const u = await this._loadUser(userId);
    Object.assign(u, patch || {});
    await this._saveUser(u);
    return true;
  }

  async getCompliment() {
    const list = await readLines(FILE_COMPLIMENTS);
    if (!list.length) return 'You are wonderful.';
    return list[Math.floor(Math.random() * list.length)];
  }

  _composeReply(text, user) {
    const gentle = user.tone === 'gentle' ? '💖 ' : '';
    const likeHint = user.likes?.length ? ` I know you like ${user.likes[0]}.` : '';
    const signature = this.opts.signature || 'Sweet dreams.';
    return `${gentle}Thanks for sharing. ${signature}${likeHint}`;
  }

  async respond(text, { userId = 'anon' } = {}) {
    const u = await this._loadUser(userId);

    u.history.push({ ts: new Date().toISOString(), role: 'user', text: String(text ?? '') });
    if (u.history.length > 50) u.history = u.history.slice(-50);

    const reply = this._composeReply(text, u);

    u.history.push({ ts: new Date().toISOString(), role: 'agent', text: reply });
    await this._saveUser(u);

    return reply;
  }
}