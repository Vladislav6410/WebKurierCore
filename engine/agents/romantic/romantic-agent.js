// engine/agents/romantic/romantic-agent.js
import fs from 'fs';
import path from 'path';

export class RomanticAgent {
  constructor(config = {}) {
    this.cfg = config;
    this.memDir = path.join(process.cwd(), 'engine/agents/romantic/memory');
    if (!fs.existsSync(this.memDir)) fs.mkdirSync(this.memDir, { recursive: true });
  }

  get modes() { return ['chat','poetry','date-planner','soothing','letters']; }

  async handle(input, ctx = {}) {
    const mode = ctx.mode || this.cfg.default_mode || 'chat';
    const persona = await this._read('persona.prompt.txt',
      'You are a warm, respectful, romantic companion.');
    const safety = await this._read('safety.policy.md',
      'Stay PG-13, consent-first, non-explicit, no therapy advice.');

    const basePrompt = `${persona}\n\n${safety}\n\nUser: "${input}"`;
    switch (mode) {
      case 'poetry':        return this._llm(`${basePrompt}\nWrite a short tender poem.`);
      case 'date-planner':  return this._llm(`${basePrompt}\nSuggest 3 cozy date ideas with details.`);
      case 'soothing':      return this._llm(`${basePrompt}\nOffer a calm, supportive message.`);
      case 'letters':       return this._llm(`${basePrompt}\nDraft a romantic letter (120–180 words).`);
      default:              return this._llm(`${basePrompt}\nContinue a gentle conversation.`);
    }
  }

  async _llm(prompt) {
    // TODO: подключи твой LLM-клиент. Пока заглушка:
    return `⟡ demo ⟡\n\n${prompt.slice(0, 200)}...`;
  }

  async _read(file, fallback) {
    const p = path.join(process.cwd(), 'engine/agents/romantic', file);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : fallback;
  }
}

export default RomanticAgent;