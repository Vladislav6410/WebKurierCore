// voice.js
console.log("🎙 Voice module loaded");

const micButton = document.getElementById("mic-button");
const sourceInput = document.getElementById("source-text");

let recognition;
let isListening = false;

// Проверка поддержки браузером
if (!("webkitSpeechRecognition" in window)) {
  micButton.disabled = true;
  micButton.title = "🎤 Браузер не поддерживает голосовой ввод";
} else {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micButton.textContent = "🛑";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    sourceInput.value += (sourceInput.value ? " " : "") + transcript;
    micButton.textContent = "🎤";
    isListening = false;
  };

  recognition.onerror = (e) => {
    console.error("🎙 Ошибка распознавания:", e.error);
    micButton.textContent = "🎤";
    isListening = false;
  };

  recognition.onend = () => {
    if (isListening) micButton.textContent = "🎤";
    isListening = false;
  };

  // Старт/стоп по нажатию
  micButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = document.getElementById("language-select").value || "en";
      recognition.start();
    }
  });
}