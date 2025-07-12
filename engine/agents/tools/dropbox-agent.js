// === config.js ===
// Централизованная конфигурация проекта WebKurierCore

const CONFIG = {
  TELEGRAM: {
    enabled: false,
    botToken: "___TELEGRAM_BOT_TOKEN___",
    botUsername: "___BOT_USERNAME___"
  },
  DROPBOX: {
    enabled: false,
    accessToken: "___DROPBOX_ACCESS_TOKEN___",
    rootFolder: "/WebKurierCore/"
  },
  OPENAI: {
    enabled: false,
    apiKey: "___OPENAI_API_KEY___",
    model: "gpt-4"
  },
  TRANSLATOR: {
    enabled: true,
    defaultLanguage: "ru",
    autoDetect: true,
    provider: "LibreTranslate"
  },
  VOICE: {
    enabled: true,
    lang: "ru-RU",
    engine: "speechSynthesis"
  },
  WALLET: {
    initialBalance: 1000,
    localStorageKey: "webcoin_balance"
  },
  DEBUG: true,
  VERSION: "1.0.0"
};

export default CONFIG;