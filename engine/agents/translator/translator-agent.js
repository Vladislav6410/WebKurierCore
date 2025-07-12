// === translator-agent.js ===
// Главный агент-переводчик WebKurierCore

import CONFIG from '../../config.js';
import * as LibreTranslate from './libretranslate.js';

const { defaultLanguage, autoDetect, service, enabled } = CONFIG.TRANSLATOR;

export const TranslatorAgent = {
  enabled,

  async translate(text, targetLang = defaultLanguage) {
    if (!enabled) return "🔒 Переводчик отключён в config.js";

    const fromLang = autoDetect ? 'auto' : defaultLanguage;

    switch (service) {
      case 'libretranslate':
        return await LibreTranslate.translate(text, fromLang, targetLang);

      default:
        return `❌ Неизвестный переводчик: ${service}`;
    }
  },

  async detect(text) {
    if (!enabled || !autoDetect) return defaultLanguage;

    switch (service) {
      case 'libretranslate':
        return await LibreTranslate.detect(text);
      default:
        return defaultLanguage;
    }
  },

  getSettings() {
    return {
      from: autoDetect ? 'auto' : defaultLanguage,
      to: defaultLanguage,
      service,
    };
  }
};