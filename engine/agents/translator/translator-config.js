// engine/agents/translator/translator-config.js

// Доступные провайдеры перевода
const ALLOWED_PROVIDERS = ["auto", "libre", "gpt", "local"];

const DEFAULT_CONFIG = {
  showOriginal: true,       // показывать оригинал + перевод
  provider: "auto",         // 'auto' | 'libre' | 'gpt' | 'local'
  defaultTargetLang: "en"   // запасной язык, если не указан
};

function getStorageKey(userId) {
  return `wk_translator_config:${userId || "local"}`;
}

function normalizeProvider(providerKey) {
  if (!providerKey) return "auto";
  const key = providerKey.toLowerCase();
  return ALLOWED_PROVIDERS.includes(key) ? key : "auto";
}

/**
 * Загрузка конфига пользователя.
 * Источник — localStorage (если доступен).
 */
export function loadTranslatorConfig(userId = "local") {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return { ...DEFAULT_CONFIG };

    const parsed = JSON.parse(raw);
    const cfg = { ...DEFAULT_CONFIG, ...parsed };
    cfg.provider = normalizeProvider(cfg.provider);
    return cfg;
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Сохранение конфига пользователя в localStorage.
 */
export function saveTranslatorConfig(userId = "local", config = {}) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const merged = { ...DEFAULT_CONFIG, ...config };
    merged.provider = normalizeProvider(merged.provider);
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(merged));
  } catch (e) {
    // тихо игнорируем ошибки localStorage
  }
}

/**
 * Список доступных провайдеров (для UI или /translate providers).
 */
export function getAvailableProviders() {
  return [...ALLOWED_PROVIDERS];
}