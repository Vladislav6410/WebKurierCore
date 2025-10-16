// engine/agents/tools/ai-builder.js
// Мини-движок: offline-режим (правила + шаблоны) и online-режим (через /api/ai/generate)
// Не хранит ключи в коде. Бэкенд подключим позже.

export class AIDesigner {
  constructor({ templatesUrl = 'engine/agents/tools/templates.json' } = {}) {
    this.templatesUrl = templatesUrl;
    this.templates = null;
  }

  async loadTemplates() {
    if (this.templates) return this.templates;
    const res = await fetch(this.templatesUrl);
    if (!res.ok) throw new Error(`Не удалось загрузить templates.json: ${res.status}`);
    this.templates = await res.json();
    return this.templates;
  }

  // --- Offline генерация по правилам (без LLM) ---
  async generateOffline(promptText) {
    await this.loadTemplates();
    const p = promptText.toLowerCase();

    // Примитивный разбор пожеланий
    const needsDark = /т(е|ё)мн|dark/.test(p);
    const needsHero = /hero|хиро|заглавн/.test(p);
    const needsGrid = /grid|карточк|3|три/.test(p);
    const needsForm = /форм|contact|обратн/.test(p);
    const needsFooter = /footer|футер|низ/.test(p);

    // Берём блоки из templates.json
    const pick = key => (this.templates[key] && this.templates[key][0]) || null;

    const parts = [];
    parts.push(this._scaffoldHead({ dark: needsDark, title: 'Автогенерация | WebKurier' }));
    parts.push('<body>');

    if (needsHero) parts.push(pick('hero')?.html || this._fallbackHero());
    if (needsGrid) parts.push(pick('cards3')?.html || this._fallbackCards3());
    if (needsForm) parts.push(pick('contact')?.html || this._fallbackContact());

    // если ничего не распознали — хотя бы базовый hero + cards
    if (parts.length <= 2) {
      parts.push(this._fallbackHero());
      parts.push(this._fallbackCards3());
    }

    if (needsFooter) parts.push(pick('footer')?.html || this._fallbackFooter());
    parts.push('</body></html>');

    // Базовые стили (можно вынести в отдельный файл)
    const css = (this.templates.baseCSS || this._baseCSS({ dark: needsDark }));
    return { html: parts.join('\n'), css };
  }

  // --- Online (через бэкенд/LLM) — подключим когда будет готов /api ---
  async generateOnline(promptText) {
    const res = await fetch('/api/ai/generate-layout', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ prompt: promptText })
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    // Ожидаем { html, css, assets? }
    return data;
  }

  // --- Вспомогательные секции/стили (fallback) ---
  _scaffoldHead({ dark, title }) {
    const theme = dark ? '#0b0c10' : '#fff';
    const color = dark ? '#e6e6e6' : '#111';
    return `
<!doctype html><html lang="ru"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:${theme};color:${color}}</style>
</head>`;
  }

  _fallbackHero() {
    return `
<section style="padding:72px 16px;max-width:980px;margin:0 auto;text-align:center">
  <h1 style="margin:0 0 12px">Готовы запустить проект?</h1>
  <p style="opacity:.8;margin:0 0 20px">Эта секция создана автоматически. Опиши, что тебе нужно — и мы соберём страницу.</p>
  <button style="padding:12px 20px;border:1px solid currentColor;background:transparent;border-radius:10px;cursor:pointer">
    Связаться
  </button>
</section>`;
  }

  _fallbackCards3() {
    return `
<section style="padding:40px 16px;max-width:1100px;margin:0 auto">
  <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
    ${[1,2,3].map(i=>`
      <div style="border:1px solid #3a3a3a;border-radius:12px;padding:16px">
        <h3 style="margin:0 0 8px">Карточка ${i}</h3>
        <p style="opacity:.8;margin:0">Краткое описание преимущества или услуги.</p>
      </div>
    `).join('')}
  </div>
</section>`;
  }

  _fallbackContact() {
    return `
<section style="padding:40px 16px;max-width:720px;margin:0 auto">
  <h2 style="margin:0 0 16px">Свяжемся с вами</h2>
  <form onsubmit="event.preventDefault();alert('Отправлено!')" style="display:grid;gap:12px">
    <input placeholder="Имя" required style="padding:12px;border-radius:10px;border:1px solid #3a3a3a;background:transparent;color:inherit"/>
    <input type="email" placeholder="Email" required style="padding:12px;border-radius:10px;border:1px solid #3a3a3a;background:transparent;color:inherit"/>
    <textarea placeholder="Сообщение" rows="4" style="padding:12px;border-radius:10px;border:1px solid #3a3a3a;background:transparent;color:inherit"></textarea>
    <button style="padding:12px 20px;border:1px solid currentColor;background:transparent;border-radius:10px;cursor:pointer">Отправить</button>
  </form>
</section>`;
  }

  _fallbackFooter() {
    return `
<footer style="padding:24px 16px;opacity:.7;text-align:center;border-top:1px solid #3a3a3a">
  © WebKurier ${new Date().getFullYear()}
</footer>`;
  }

  _baseCSS({ dark }) {
    // Можешь заменить на содержимое из templates.baseCSS
    return `/* base.css */`;
  }
}