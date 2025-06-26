// engine/agents/translator/libretranslate.js

const API_URL = 'https://libretranslate.de'; // Можно заменить на другой сервер LibreTranslate

// Определение языка текста
export async function detectLanguage(text) {
  const res = await fetch(`${API_URL}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text })
  });
  const data = await res.json();
  return data[0]?.language || 'en';
}

// Перевод текста
export async function translateText(text, sourceLang, targetLang) {
  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    })
  });
  const data = await res.json();
  return data?.translatedText || '[Ошибка перевода]';
}