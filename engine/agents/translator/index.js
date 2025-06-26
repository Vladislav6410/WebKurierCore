// engine/agents/translator/index.js

import { detectLanguage, translateText } from './libretranslate.js';

export async function handleTranslation(inputText, targetLang = 'en') {
  const sourceLang = await detectLanguage(inputText);
  const result = await translateText(inputText, sourceLang, targetLang);
  return {
    original: inputText,
    translated: result,
    from: sourceLang,
    to: targetLang
  };
}