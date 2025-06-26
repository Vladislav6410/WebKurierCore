// voice-agent.js
console.log("🎙 Voice Agent загружен");

export const VoiceAgent = {
  name: "Voice",
  description: "Управляет голосовыми функциями, синтезом речи и языковыми настройками.",
  version: "1.0.0",

  settings: {
    language: "ru",
    speed: 1.0,
    pitch: 1.0,
    voices: ["ru-RU", "en-US", "de-DE", "pl-PL"]
  },

  speak(text) {
    if (!window.speechSynthesis) return "❗ Голосовой движок не поддерживается.";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.settings.language;
    utter.rate = this.settings.speed;
    utter.pitch = this.settings.pitch;
    speechSynthesis.speak(utter);
    return `🔊 Произнесено: ${text}`;
  },

  setLanguage(lang) {
    if (!this.settings.voices.includes(lang)) return "❗ Язык не поддерживается.";
    this.settings.language = lang;
    return `🌐 Язык установлен: ${lang}`;
  },

  commands: {
    "/say": (args) => VoiceAgent.speak(args || "Привет!"),
    "/lang": (arg) => VoiceAgent.setLanguage(arg || "ru"),
    "/help": () =>
      "🎙 Команды голосового агента:\n" +
      "• /say [текст] — произнести вслух\n" +
      "• /lang [код] — установить язык (ru, en-US, de-DE, pl-PL)\n" +
      "• /help — помощь"
  },

  handleCommand(input) {
    const [cmd, ...args] = input.trim().split(" ");
    const fn = this.commands[cmd];
    return fn ? fn(args.join(" ")) : "❓ Неизвестная команда. Введи /help";
  }
};