// interface.js
console.log("🌐 Translator Interface loaded");

const sourceInput = document.getElementById("source-text");
const resultOutput = document.getElementById("result-text");
const languageSelect = document.getElementById("language-select");
const translateButton = document.getElementById("translate-button");
const copyButton = document.getElementById("copy-button");
const speakerButton = document.getElementById("speaker-button");
const swapButton = document.getElementById("swap-button");

// Поддерживаемые языки (можно расширить)
const languages = {
  "en": "English",
  "ru": "Русский",
  "de": "Deutsch",
  "pl": "Polski",
  "fr": "Français",
  "es": "Español",
  "zh": "中文",
  "ar": "العربية"
};

// Заполнение выпадающего списка языков
function populateLanguages() {
  for (const code in languages) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = languages[code];
    languageSelect.appendChild(option);
  }
}

// Отправка текста на перевод (использует LibreTranslate, можно заменить)
async function translateText() {
  const text = sourceInput.value.trim();
  const targetLang = languageSelect.value;

  if (!text) {
    resultOutput.value = "⚠️ Введите текст для перевода.";
    return;
  }

  const response = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: targetLang,
      format: "text"
    })
  });

  const data = await response.json();
  resultOutput.value = data.translatedText || "❌ Ошибка перевода";
}

// Кнопка "Копировать"
copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(resultOutput.value);
  copyButton.textContent = "✅ Скопировано!";
  setTimeout(() => copyButton.textContent = "📋", 1500);
});

// Кнопка "Озвучить"
speakerButton.addEventListener("click", () => {
  const utterance = new SpeechSynthesisUtterance(resultOutput.value);
  utterance.lang = languageSelect.value;
  speechSynthesis.speak(utterance);
});

// Кнопка "Сменить текст ↔ перевод"
swapButton.addEventListener("click", () => {
  const temp = sourceInput.value;
  sourceInput.value = resultOutput.value;
  resultOutput.value = temp;
});

// Подключение событий
translateButton.addEventListener("click", translateText);
languageSelect.addEventListener("change", () => resultOutput.value = "");
document.addEventListener("DOMContentLoaded", populateLanguages);