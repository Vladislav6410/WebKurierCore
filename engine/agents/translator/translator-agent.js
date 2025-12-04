// engine/agents/translator/translator-agent.js

import { loadTranslatorConfig } from "./translator-config.js";

// Предполагаем, что в libretranslate.js есть функции:
//   translate(text, targetLang, sourceLang?)
//   detect(text)
//   getLanguages()
import {
  translate as libreTranslate,
  detect as libreDetect,
  getLanguages as libreGetLanguages
} from "./libretranslate.js";

//
// ===== GPT-провайдер через наш API /api/translator/gpt =====
//

async function gptTranslate(text, targetLang, sourceLang = "auto") {
  const resp = await fetch("/api/translator/gpt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, targetLang, sourceLang })
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`GPT translate failed: ${resp.status} ${msg}`);
  }

  const data = await resp.json();
  // ожидаем формат { translation, detectedSourceLang }
  return data.translation || "";
}

async function gptDetect(text) {
  // Позже можно сделать отдельный эндпоинт /api/translator/gpt-detect
  throw new Error("GPT detect is not implemented yet");
}

async function gptGetLanguages() {
  // Минимальный набор — потом расширим
  return ["en", "de", "ru", "es", "fr", "pl", "uk"];
}

//
// ===== Local-провайдер (заглушка под будущее) =====
//

async function localTranslate(text, targetLang, sourceLang = "auto") {
  // сюда позже можно подключить словарь/SQLite
  throw new Error("Local provider is not implemented yet");
}
async function localDetect(text) {
  throw new Error("Local provider is not implemented yet");
}
async function localGetLanguages() {
  return [];
}

//
// ===== Карта провайдеров =====
//

const PROVIDERS = {
  libre: {
    key: "libre",
    name: "LibreTranslate",
    translate: libreTranslate,
    detect: libreDetect,
    getLanguages: libreGetLanguages
  },
  gpt: {
    key: "gpt",
    name: "GPT",
    translate: gptTranslate,
    detect: gptDetect,
    getLanguages: gptGetLanguages
  },
  local: {
    key: "local",
    name: "LocalDictionary",
    translate: localTranslate,
    detect: localDetect,
    getLanguages: localGetLanguages
  }
};

// Хранение последнего провайдера для отображения в терминале
let lastProviderName = "LibreTranslate";
let lastProviderKey = "libre";

//
// ===== Выбор провайдера по конфигу пользователя =====
//

/**
 * cfg.provider: "auto" | "libre" | "gpt" | "local"
 * "auto" сейчас всегда маппится на "libre".
 */
function resolveProvider(userId = "local-user") {
  const cfg = loadTranslatorConfig(userId);
  const providerKey = (cfg.provider || "auto").toLowerCase();

  // auto -> пока всегда libre, дальше можно сделать логику выбора
  let keyToUse = providerKey === "auto" ? "libre" : providerKey;

  if (!Object.prototype.hasOwnProperty.call(PROVIDERS, keyToUse)) {
    keyToUse = "libre";
  }

  const provider = PROVIDERS[keyToUse];
  lastProviderKey = provider.key;
  lastProviderName = provider.name;
  return provider;
}

//
// ===== Публичные функции агента =====
//

/**
 * Основная функция перевода.
 *
 * @param {string} text       исходный текст
 * @param {string} targetLang целевой ISO-код (es, ru, de, ...)
 * @param {string} userId     идентификатор пользователя (для конфига)
 * @returns {Promise<string>} перевод
 */
export async function translate(text, targetLang, userId = "local-user") {
  const provider = resolveProvider(userId);
  const sourceLang = "auto";

  const result = await provider.translate(text, targetLang, sourceLang);
  // если провайдер вернёт объект, можно сделать: return result.text;
  return result;
}

/**
 * Определение языка текста.
 */
export async function detect(text, userId = "local-user") {
  const provider = resolveProvider(userId);
  const result = await provider.detect(text);
  return result;
}

/**
 * Список поддерживаемых языков.
 */
export async function getLanguages(userId = "local-user") {
  const provider = resolveProvider(userId);
  const result = await provider.getLanguages();
  return result;
}

/**
 * Имя последнего использованного провайдера (для терминала).
 * Например: "LibreTranslate", "GPT", "LocalDictionary".
 */
export function getLastProviderName() {
  return lastProviderName;
}

/**
 * Ключ последнего провайдера: 'libre' | 'gpt' | 'local'
 */
export function getLastProviderKey() {
  return lastProviderKey;
}


