// engine/agents/translator/ui/terminal-bridge.js

import { parseCommand } from "../command-parser.js";
import {
  getLanguageCode,
  isKnownLangCommand,
  listLanguageCommands,
  listLanguagesDetailed
} from "../command-registry.js";
import {
  loadTranslatorConfig,
  saveTranslatorConfig
} from "../translator-config.js";

/**
 * Определяет, должна ли строка обрабатываться переводчиком
 * в режиме Abang.
 *
 * Логика:
 *  - /spanish ... /russian ... и т.п.          -> да
 *  - /translate            (без аргументов)    -> да (вывод списка)
 *  - /translate en text    (с аргументами)     -> НЕТ, пусть идёт в обычный /translate
 *  - /config showOriginal on|off               -> да (конфиг переводчика)
 *  - /config              (без аргументов)     -> НЕТ, пусть идёт в общий /config (CONFIG)
 */
export function isTranslatorCommand(line) {
  if (!line || typeof line !== "string") return false;
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) return false;

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const rest = parts.slice(1);

  // Языковые команды: /spanish, /russian и т.д.
  if (isKnownLangCommand(cmd)) return true;

  // /translate без аргументов — показать список языков
  if (cmd === "translate" && rest.length === 0) return true;

  // /config showOriginal on/off — конфиг переводчика
  if (cmd === "config") {
    const key = (rest[0] || "").toLowerCase();
    if (["showoriginal", "translator", "translate"].includes(key)) {
      return true;
    }
  }

  return false;
}

/**
 * Обрабатывает команду переводчика.
 *
 * Возвращает объект:
 *  {
 *    original:   string,   // исходный текст
 *    translated: string,   // перевод или служебное сообщение
 *    langCode:   string,   // целевой язык или 'info'/'cfg'
 *    provider:   string,   // имя провайдера (можно заполнять позже)
 *    showOriginal: boolean // показывать ли оригинал
 *  }
 */
export async function handleTranslatorCommand(line, { userId = "local-user" } = {}) {
  const parsed = parseCommand(line);
  const { command, args, text } = parsed;

  // 1) /translate  -> список доступных языков (Abang-style)
  if (command === "translate" && !text) {
    const langs = listLanguagesDetailed();
    return {
      original: "",
      translated: "🌍 Available languages:\n" + langs.map(l => "- " + l).join("\n"),
      langCode: "info",
      provider: "none",
      showOriginal: false
    };
  }

  // 2) /config showOriginal on|off  -> конфиг переводчика
  if (command === "config") {
    const key = (args[0] || "").toLowerCase();
    const value = (args[1] || "").toLowerCase();
    const cfg = loadTranslatorConfig(userId);

    if (key === "showoriginal") {
      if (["on", "true", "1"].includes(value)) {
        cfg.showOriginal = true;
      } else if (["off", "false", "0"].includes(value)) {
        cfg.showOriginal = false;
      } else {
        return {
          original: "",
          translated: "Использование: /config showOriginal on|off",
          langCode: "cfg",
          provider: "none",
          showOriginal: false
        };
      }
      saveTranslatorConfig(userId, cfg);
      return {
        original: "",
        translated: `⚙️ showOriginal = ${cfg.showOriginal ? "on" : "off"}`,
        langCode: "cfg",
        provider: "none",
        showOriginal: false
      };
    }

    // можно добавить другие ключи конфига здесь

    return {
      original: "",
      translated: "Доступные настройки: showOriginal on|off",
      langCode: "cfg",
      provider: "none",
      showOriginal: false
    };
  }

  // 3) Языковые команды: /spanish text, /russian text и т.п.
  if (isKnownLangCommand(command)) {
    const targetLang = getLanguageCode(command);
    const cfg = loadTranslatorConfig(userId);

    const textToTranslate = text || args.join(" ");
    if (!textToTranslate) {
      return {
        original: "",
        translated: "Введите текст после команды, например: /spanish Hello everyone",
        langCode: targetLang,
        provider: "none",
        showOriginal: false
      };
    }

    // Динамический импорт translator-agent.js
    const AgentModule = await import("../translator-agent.js");
    // Ожидаем, что там есть функция translate(text, lang)
    const translateFn = AgentModule.translate || AgentModule.default?.translate;
    if (typeof translateFn !== "function") {
      throw new Error("translator-agent.js: функция translate не найдена");
    }

    const translated = await translateFn(textToTranslate, targetLang);

    return {
      original: textToTranslate,
      translated,
      langCode: targetLang,
      provider: "auto", // можно заменить на реальное имя провайдера
      showOriginal: cfg.showOriginal !== false
    };
  }

  // На всякий случай — если что-то дошло сюда
  return {
    original: "",
    translated: "Команда переводчика не распознана.",
    langCode: "err",
    provider: "none",
    showOriginal: false
  };
}