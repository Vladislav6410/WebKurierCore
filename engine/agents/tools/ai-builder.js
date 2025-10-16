// --- Offline генерация по правилам (использует templates.blocks) ---
async generateOffline(promptText) {
  await this.loadTemplates();
  const p = (promptText || '').toLowerCase();

  const needsDark = /т(е|ё)мн|dark/.test(p);
  const parts = [];
  parts.push(this._scaffoldHead({ dark: needsDark, title: 'Автогенерация | WebKurier' }));
  parts.push('<body>');

  // --- 1. Подбираем блоки по ключевым словам ---
  const blocks = this.templates.blocks || [];
  const pick = (keywords) => {
    return blocks.find(b =>
      keywords.some(k => 
        (b.title && b.title.toLowerCase().includes(k)) ||
        (b.description && b.description.toLowerCase().includes(k))
      )
    );
  };

  // --- 2. Определяем, что просили ---
  const order = [];

  if (/hero|облож|шапк|заглав/.test(p)) order.push(pick(['hero','облож','шапк']));
  if (/двухколон|2 кол/.test(p)) order.push(pick(['двухколон','column','2 col']));
  if (/галер|gallery/.test(p)) order.push(pick(['галер','gallery']));
  if (/вход|логин|auth/.test(p)) order.push(pick(['вход','логин','auth']));
  if (/список|list/.test(p)) order.push(pick(['список','list']));
  if (/кнопк|button/.test(p)) order.push(pick(['кнопк','button']));
  if (/заголов|heading/.test(p)) order.push(pick(['заголов','heading']));
  if (/footer|футер|низ|подвал/.test(p)) order.push(pick(['footer','подвал'])) || null;

  // --- 3. Добавляем найденные блоки ---
  order.filter(Boolean).forEach(b => parts.push(b.html));

  // Если ничего не найдено — вставим fallback hero + footer
  if (order.filter(Boolean).length === 0) {
    const first = blocks[0];
    const last = blocks.find(b => /footer|подвал/.test(b.title?.toLowerCase() || '')) || blocks[blocks.length-1];
    parts.push(first?.html || '<section><h1>AI Builder</h1></section>');
    parts.push(last?.html || '<footer>© WebKurier</footer>');
  }

  parts.push('</body></html>');
  const css = this.templates.baseCSS || this._baseCSS({ dark: needsDark });
  return { html: parts.join('\n'), css };
}
