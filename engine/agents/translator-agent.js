// === Translator Agent ===
// Файл: engine/agents/translator-agent.js

console.log("🌐 Translator Agent загружен");

const supportedProviders = ["gpt", "google", "libre"];

let selectedProvider = localStorage.getItem("translator_provider") || "gpt";

// UI: переключение провайдера
function setTranslatorProvider(provider) {
  if (supportedProviders.includes(provider)) {
    selectedProvider = provider;
    localStorage.setItem("translator_provider", provider);
    console.log("✅ Выбран переводчик:", provider);
    return `🔄 Переводчик установлен: ${provider}`;
  } else {
    return "❗ Неизвестный переводчик.";
  }
}

// Получение текущего провайдера
function getTranslatorProvider() {
  return selectedProvider;
}

// Основная функция перевода
async function translateText(text, fromLang = "auto", toLang = "en") {
  switch (selectedProvider) {
    case "gpt":
      return gptTranslate(text, fromLang, toLang);
    case "google":
      return googleTranslate(text, fromLang, toLang);
    case "libre":
      return libreTranslate(text, fromLang, toLang);
    default:
      return "❌ Провайдер перевода не выбран.";
  }
}

// GPT-перевод (заглушка)
async function gptTranslate(text, from, to) {
  return `[GPT] (${from} → ${to}): ${text}`;
}

// Google Translate (заглушка)
async function googleTranslate(text, from, to) {
  return `[Google] (${from} → ${to}): ${text}`;
}

// LibreTranslate (заглушка)
async function libreTranslate(text, from, to) {
  return `[Libre] (${from} → ${to}): ${text}`;
}

// Экспорт функций (для других модулей)
window.translatorAgent = {
  setProvider: setTranslatorProvider,
  getProvider: getTranslatorProvider,
  translate: translateText,
};