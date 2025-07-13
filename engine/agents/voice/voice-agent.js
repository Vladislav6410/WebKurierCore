// engine/agents/voice/voice-agent.js

export const VoiceAgent = {
  speak: (text = '') => {
    if (!text) {
      text = document.getElementById("voice-input")?.value || '';
    }

    if (!text.trim()) {
      VoiceAgent._output("❗ Введите текст для озвучивания.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU"; // можно поменять на "en-US", "de-DE" и т.д.

    speechSynthesis.speak(utterance);
    VoiceAgent._output("🔊 Озвучено: " + text);
  },

  stop: () => {
    speechSynthesis.cancel();
    VoiceAgent._output("⛔ Озвучивание остановлено.");
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) out.innerText = text;
  }
};