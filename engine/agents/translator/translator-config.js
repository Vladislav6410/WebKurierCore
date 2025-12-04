// engine/agents/translator/translator-config.js

const DEFAULT_CONFIG = {
  showOriginal: true,        // показывать оригинал + перевод
  defaultTargetLang: "en"    // запасной язык, если не указан
};

function getStorageKey(userId) {
  return `wk_translator_config:${userId || "local"}`;
}

/**
 * Загрузка конфига пользователя.
 * Пытается взять из localStorage; если нет — возвращает дефолт.
 */
export function loadTranslatorConfig(userId = "local") {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
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
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(merged));
  } catch (e) {
    // тихо игнорируем ошибки localStorage
  }
}