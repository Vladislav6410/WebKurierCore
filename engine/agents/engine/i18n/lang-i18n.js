// engine/i18n/lang-i18n.js
// минимальное ядро: загрузка словаря, t(), события, RTL/LTR, кеш

const STORAGE_KEY = 'ra_lang';
const cache = new Map();
let current = localStorage.getItem(STORAGE_KEY) || 'ru';
let dict = null;

export const LANGS = [
  { code:'jp', flag:'🇯🇵', name:'日本語' },
  { code:'kr', flag:'🇰🇷', name:'한국어' },
  { code:'en', flag:'🇺🇸', name:'English' },
  { code:'de', flag:'🇩🇪', name:'Deutsch' },
  { code:'pl', flag:'🇵🇱', name:'Polski' },
  { code:'hi', flag:'🇮🇳', name:'हिन्दी' },
  { code:'tr', flag:'🇹🇷', name:'Türkçe' },
  { code:'ar', flag:'🇸🇦', name:'العربية' },
  { code:'pt', flag:'🇧🇷', name:'Português' },
  { code:'es', flag:'🇪🇸', name:'Español' },
  { code:'ru', flag:'🇷🇺', name:'Русский' } // админ
];

function getByPath(obj, path) {
  return path.split('.').reduce((o,k)=> (o && k in o)? o[k] : undefined, obj);
}

export function getLang(){ return current; }

export async function setLang(code){
  if (!code) return;
  current = code;
  localStorage.setItem(STORAGE_KEY, code);
  await loadDict(code);
  applyRTL();
  translateDOM();
  window.dispatchEvent(new CustomEvent('languageChanged', { detail:{ code, dict }}));
}

export async function loadDict(code = current){
  if (cache.has(code)) { dict = cache.get(code); return dict; }
  const res = await fetch(`../lang/${code}.json`);
  if (!res.ok) throw new Error(`Lang file not found: ${code}`);
  dict = await res.json();
  cache.set(code, dict);
  return dict;
}

export function t(path, fallback=''){
  const val = getByPath(dict || {}, path);
  return (val == null) ? fallback : val;
}

// заменить все [data-i18n] в DOM
export function translateDOM(root=document){
  root.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = t(key, el.textContent);
    if (typeof val === 'string') el.textContent = val;
  });
}

// проставить dir="rtl" для арабского и т.п.
function applyRTL(){
  const rtl = !!(dict && dict.language && dict.language.rtl);
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
}

export async function i18nInit(defaultCode='ru'){
  try {
    if (!current) current = defaultCode;
    await setLang(current);
  } catch (e){
    console.error('[i18nInit]', e);
    if (current !== defaultCode) await setLang(defaultCode);
  }
}