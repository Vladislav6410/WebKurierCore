// engine/agents/translator/command-registry.js

// Registry mapping language commands (slash commands excluded) to ISO 639-1 codes
const LANGUAGE_COMMANDS = {
  english:   "en",
  german:    "de",
  polish:    "pl",
  ukrainian: "uk",
  russian:   "ru",
  french:    "fr",
  spanish:   "es",
  italian:   "it",
  chinese:   "zh",
  korean:    "ko",
  arabic:    "ar",
  japanese:  "ja"
};

// Resolve provider name from provider key
const PROVIDER_NAMES = {
  auto: "Auto",
  libre: "LibreTranslate",
  gpt: "GPT",
  local: "LocalDictionary"
};

/**
 * Parse a slash command line into command, args, and text
 * Example:
 *   "/config provider libre" → {command:"config", args:["provider","libre"], text:"provider libre"}
 */
export function parseCommandLine(line = "") {
  if (!line || typeof line !== "string") {
    return { command: "", args: [], text: "" };
  }
  const trimmed = line.trim().replace(/^\/+/, "");
  const parts = trimmed.split(/\s+/);
  const command = parts.shift()?.toLowerCase() || "";
  const text = parts.join(" ");
  return { command, args: parts, text };
}

/**
 * Return ISO language code for a given command name
 * Example: "Spanish" → "es"
 */
export function getLanguageCode(commandName = "") {
  if (!commandName) return null;
  const key = commandName.toLowerCase();
  return LANGUAGE_COMMANDS[key] || null;
}

/**
 * Check whether a token is a recognized language command
 * Example: "arabic" → true
 */
export function isKnownLangCommand(commandName = "") {
  return !!getLanguageCode(commandName);
}

/**
 * Return display name for a provider key
 * Example: "libre" → "LibreTranslate"
 */
export function getProviderName(providerKey = "auto") {
  return PROVIDER_NAMES[providerKey.toLowerCase()] || PROVIDER_NAMES.auto;
}

/**
 * Return detailed language command listing
 * Example: ["english (en)", "german (de)", ...]
 */
export function listLanguageCommands() {
  return Object.entries(LANGUAGE_COMMANDS).map(
    ([cmd, iso]) => `${cmd} (${iso})`
  );
}

/**
 * Validate provider switch key/value
 * Example: validateProviderChange("gpt") → {ok:true,value:"gpt",name:"GPT"}
 */
export function validateProviderChange(value = "auto") {
  const key = value.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(PROVIDER_NAMES, key)) {
    return {
      ok: false,
      message: "Invalid provider. Allowed: auto|libre|gpt|local"
    };
  }
  return { ok: true, value: key, name: PROVIDER_NAMES[key] };
}

/**
 * Return provider labels detailed list
 * Example: ["auto → Auto", "libre → LibreTranslate", ...]
 */
export function listProvidersDetailed() {
  return Object.entries(PROVIDER_NAMES).map(
    ([k, v]) => `${k} → ${v}`
  );
}


