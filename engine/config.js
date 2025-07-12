// === engine/config.js ===
// Централизованная конфигурация WebKurierCore

const CONFIG = {
  // 🌐 Telegram-бот
  TELEGRAM: {
    enabled: true,
    botToken: "___TELEGRAM_BOT_TOKEN___", // ← 🔐 Заглушка токена
    botUsername: "@WebKurierBot"          // ← Имя вашего бота
  },

  // 📦 Dropbox-интеграция
  DROPBOX: {
    enabled: true,
    accessToken: "___DROPBOX_ACCESS_TOKEN___", // ← 🔐 Заглушка токена
    folderPath: "/WebKurierCore/"             // ← Путь к папке
  },

  // 🤖 OpenAI / GPT
  OPENAI: {
    enabled: false,                             // ← Пока отключено
    apiKey: "___OPENAI_API_KEY___",             // ← 🔐 Заглушка
    model: "gpt-4"
  },

  // 🌍 Переводчик / мультиязычие
  TRANSLATOR: {
    defaultLang: "ru",        // ← Язык по умолчанию
    autoDetect: true,         // ← Автоопределение языка
    service: "LibreTranslate" // ← Тип: LibreTranslate, Google, GPT
  },

  // 🎙 Озвучка
  VOICE: {
    enabled: true,
    lang: "ru-RU"
  },

  // 🪙 WebCoin-настройки
  WALLET: {
    initialBalance: 1000,
    localStorageKey: "webcoin_balance"
  },

  // ⚙️ Отладка и версия
  DEBUG: true,
  VERSION: "1.0.0"
};

export default CONFIG;