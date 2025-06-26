// voice.js
console.log("🎙 Voice module loaded");

// 🎧 Озвучивание перевода
function speakOutput() {
  const output = document.getElementById("output").textContent;
  const utterance = new SpeechSynthesisUtterance(output);
  utterance.lang = document.getElementById("targetLang").value || "en";
  speechSynthesis.speak(utterance);
}

// 🎤 Голосовой ввод (Speech-to-Text)
const micButton = document.getElementById("mic-button");
const inputField = document.getElementById("inputText");

let recognition;
let isListening = false;

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
    inputField.value += (inputField.value ? " " : "") + transcript;
    micButton.textContent = "🎤";
    isListening = false;
  };

  recognition.onerror = (e) => {
    console.error("🎙 Ошибка распознавания:", e.error);
    micButton.textContent = "🎤";
    isListening = false;
  };

  recognition.onend = () => {
    micButton.textContent = "🎤";
    isListening = false;
  };

  micButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = document.getElementById("sourceLang").value || "auto";
      recognition.start();
    }
  });
}