// engine/agents/romantic/ui/lang-menu.js
// создаёт компактное меню c флагами и селектом; использует ядро i18n

import { LANGS, getLang, setLang, t } from '../../../i18n/lang-i18n.js';

export function createLangMenu(target){
  const wrap = document.createElement('div');
  wrap.className = 'ra-lang-card';
  wrap.innerHTML = `
    <style>
      .ra-lang-card{ background:#11151a;border:1px solid #263241;border-radius:12px;padding:12px;color:#e9eef4;font:14px system-ui; }
      .ra-row{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      .ra-btn{ display:inline-flex; align-items:center; gap:6px; padding:8px 10px; border:1px solid #263241; border-radius:10px; background:#0f141a; color:inherit; cursor:pointer; }
      .ra-btn.active{ outline:2px solid #5fb0ff; }
      .ra-select{ width:100%; margin-top:8px; background:#0f141a; color:inherit; border:1px solid #263241; border-radius:10px; padding:8px; }
      .ra-note{ color:#aab7c4; font-size:12px; margin-top:6px; }
    </style>
    <div class="ra-row" id="btns"></div>
    <select id="select" class="ra-select" aria-label="Language select"></select>
    <div class="ra-note" id="note"></div>
  `;
  target.appendChild(wrap);

  // кнопки
  const btns = wrap.querySelector('#btns');
  LANGS.forEach(l=>{
    const b = document.createElement('button');
    b.className = 'ra-btn';
    b.dataset.code = l.code;
    b.innerHTML = `${l.flag} ${l.name} <span style="opacity:.6">(${l.code})</span>`;
    b.addEventListener('click', ()=> setLang(l.code));
    btns.appendChild(b);
  });

  // селект
  const sel = wrap.querySelector('#select');
  sel.innerHTML = LANGS.map(l=>`<option value="${l.code}">${l.flag} ${l.name} (${l.code})</option>`).join('');
  sel.addEventListener('change', e => setLang(e.target.value));

  // синхронизировать активность
  function syncActive(){
    const code = getLang();
    wrap.querySelectorAll('.ra-btn').forEach(b => b.classList.toggle('active', b.dataset.code === code));
    sel.value = code;
    wrap.querySelector('#note').textContent = `dir: ${document.documentElement.getAttribute('dir') || 'ltr'}`;
    // пример перевода label ниже при наличии data-i18n извне: // wrap.querySelector('h3')?.textContent = t('menu.language','Language');
  }
  syncActive();
  window.addEventListener('languageChanged', syncActive);
}