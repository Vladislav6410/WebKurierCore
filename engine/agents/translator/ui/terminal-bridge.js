// engine/agents/translator/ui/terminal-bridge.js

import { parseCommand } from "../command-parser.js";
import {
  getLanguageCode,
  isKnownLangCommand,
  listLanguagesDetailed
} from "../command-registry.js";
import {
  loadTranslatorConfig,
  saveTranslatorConfig,
  getAvailableProviders
} from "../translator-config.js";

/**
 * Определяет, должна ли строка обрабатываться переводчиком
 * в стиле Abang (slash-команды /spanish, /config, /translate).
 */
export function isTranslatorCommand(line) {
  if (!line || typeof line !== "string") return false;
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) return false;

  const { command, args } = parseCommand(trimmed);

  // Языковые команды: /spanish, /russian и т.д.
  if (isKnownLangCommand(command)) return true;

  // /translate без аргументов — показать список языков
  if (command === "translate" && (!args || args.length === 0)) {
    return true;
  }

  // /config showOriginal on|off или /config provider ...
  if (command === "config") {
    const key = (args[0] || "").toLowerCase();
    if (["showoriginal", "translator", "translate", "provider"].includes(key)) {
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
 *    original:     string,
 *    translated:   string,
 *    langCode:     string,
 *    provider:     string,   // имя провайдера ("LibreTranslate", "GPT", "LocalDictionary", "none")
 *    showOriginal: boolean
 *  }
 */
export async function handleTranslatorCommand(
  line,
  { userId = "local-user" } = {}
) {
  const { command, args, text } = parseCommand(line);

  //
  // 1) /translate  -> список доступных языков
  //
  if (command === "translate" && !text) {
    const langs = listLanguagesDetailed();
    return {
      original: "",
      translated:
        "🌍 Available languages:\n" +
        langs.map((l) => "- " + l).join("\n"),
      langCode: "info",
      provider: "none",
      showOriginal: false
    };
  }

  //
  // 2) /config ...  -> конфиг переводчика
  //
  if (command === "config") {
    const key = (args[0] || "").toLowerCase();
    const value = (args[1] || "").toLowerCase();
    const cfg = loadTranslatorConfig(userId);

    //
    // 2.1. /config showOriginal on|off
    //
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

    //
    // 2.2. /config provider auto|libre|gpt|local
    //
    if (key === "provider") {
      const available = getAvailableProviders(); // ["auto", "libre", "gpt", "local"]
      const v = value || "auto";

      if (!available.includes(v)) {
        return {
          original: "",
          translated:
            "Использование: /config provider " + available.join("|"),
          langCode: "cfg",
          provider: "none",
          showOriginal: false
        };
      }

      cfg.provider = v;
      saveTranslatorConfig(userId, cfg);

      return {
        original: "",
        translated: `⚙️ provider = ${cfg.provider}`,
        langCode: "cfg",
        provider: "none",
        showOriginal: false
      };
    }

    //
    // 2.3. Резюме по настройкам
    //
    return {
      original: "",
      translated:
        "Доступные настройки:\n" +
        "- /config showOriginal on|off\n" +
        "- /config provider auto|libre|gpt|local",
      langCode: "cfg",
      provider: "none",
      showOriginal: false
    };
  }

  //
  // 3) Языковые команды: /spanish text, /russian text, ...
  //
  if (isKnownLangCommand(command)) {
    const targetLang = getLanguageCode(command);
    const cfg = loadTranslatorConfig(userId);

    const textToTranslate = text || args.join(" ");
    if (!textToTranslate) {
      return {
        original: "",
        translated:
          "Введите текст после команды, например: /spanish Hello everyone",
        langCode: targetLang,
        provider: "none",
        showOriginal: false
      };
    }

    // Динамический импорт translator-agent.js
    const AgentModule = await import("../translator-agent.js");
    const translateFn =
      AgentModule.translate || AgentModule.default?.translate;
    if (typeof translateFn !== "function") {
      throw new Error("translator-agent.js: функция translate не найдена");
    }

    const translated = await translateFn(textToTranslate, targetLang, userId);

    let providerName = "auto";
    if (typeof AgentModule.getLastProviderName === "function") {
      providerName = AgentModule.getLastProviderName() || "auto";
    }

    return {
      original: textToTranslate,
      translated,
      langCode: targetLang,
      provider: providerName,
      showOriginal: cfg.showOriginal !== false
    };
  }

  //
  // 4) На всякий случай fallback (не должен срабатывать при правильной isTranslatorCommand)
  //
  return {
    original: "",
    translated: "Команда переводчика не распознана.",
    langCode: "err",
    provider: "none",
    showOriginal: false
  };
}


