// engine/agents/translator/command-registry.js

// Карта "команда" -> "ISO-код языка"
const LANGUAGE_COMMANDS = {
  spanish:   "es",
  russian:   "ru",
  french:    "fr",
  arabic:    "ar",
  japanese:  "ja",
  german:    "de",
  english:   "en",
  polish:    "pl",
  ukrainian: "uk",
  italian:   "it",
  chinese:   "zh",
  korean:    "ko"
  // при необходимости легко расширяется
};

/**
 * Возвращает ISO-код языка по имени команды (без /).
 *   'spanish' -> 'es'
 */
export function getLanguageCode(commandName) {
  if (!commandName) return null;
  const key = commandName.toLowerCase();
  return LANGUAGE_COMMANDS[key] || null;
}

/**
 * Проверяет, является ли команда языковой (например, /spanish, /russian).
 */
export function isKnownLangCommand(commandName) {
  return !!getLanguageCode(commandName);
}

/**
 * Список имён команд без слеша: ['spanish', 'russian', ...]
 */
export function listLanguageCommands() {
  return Object.keys(LANGUAGE_COMMANDS);
}

/**
 * Человекочитаемый список, например:
 * ["spanish (es)", "russian (ru)", ...]
 */
export function listLanguagesDetailed() {
  return Object.entries(LANGUAGE_COMMANDS).map(
    ([cmd, iso]) => `${cmd} (${iso})`
  );
}