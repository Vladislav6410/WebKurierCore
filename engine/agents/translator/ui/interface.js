console.log("🌐 Translator Interface loaded");

const sourceInput = document.getElementById("source-text");
const resultOutput = document.getElementById("result-text");
const languageSelect = document.getElementById("language-select");
const translateButton = document.getElementById("translate-button");
const copyButton = document.getElementById("copy-button");
const speakerButton = document.getElementById("speaker-button");
const swapButton = document.getElementById("swap-button");

// Поддерживаемые языки
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

// Перевод текста
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

// Дополнительные функции

function performTranslation() {
  const inputText = document.getElementById("inputText").value.trim();
  const sourceLang = document.getElementById("sourceLang").value;
  const targetLang = document.getElementById("targetLang").value;
  const outputDiv = document.getElementById("output");

  if (!inputText) {
    outputDiv.textContent = "⚠️ Введите текст для перевода.";
    return;
  }

  outputDiv.textContent = "🔄 Перевожу...";

  fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: inputText,
      source: sourceLang,
      target: targetLang,
      format: "text"
    })
  })
    .then(res => res.json())
    .then(data => {
      outputDiv.textContent = data.translatedText || "❌ Перевод не выполнен.";
    })
    .catch(err => {
      console.error(err);
      outputDiv.textContent = "❌ Ошибка при переводе.";
    });
}

function speakOutput() {
  const text = document.getElementById("output").textContent;
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

function copyOutput() {
  const text = document.getElementById("output").textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Текст скопирован.");
  });
}

function clearAll() {
  document.getElementById("inputText").value = "";
  document.getElementById("output").textContent = "Здесь будет перевод...";
}

function handleFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return alert("Файл не выбран.");

  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    document.getElementById('inputText').value = text;
    translateText();
  };

  if (file.type.startsWith('image/')) {
    alert("📷 Распознавание текста из изображений пока не реализовано.");
  } else {
    reader.readAsText(file);
  }
}

// Обработчики событий
copyButton?.addEventListener("click", () => {
  navigator.clipboard.writeText(resultOutput.value);
  copyButton.textContent = "✅ Скопировано!";
  setTimeout(() => copyButton.textContent = "📋", 1500);
});

speakerButton?.addEventListener("click", () => {
  const utterance = new SpeechSynthesisUtterance(resultOutput.value);
  utterance.lang = languageSelect.value;
  speechSynthesis.speak(utterance);
});

swapButton?.addEventListener("click", () => {
  const temp = sourceInput.value;
  sourceInput.value = resultOutput.value;
  resultOutput.value = temp;
});

translateButton?.addEventListener("click", translateText);
languageSelect?.addEventListener("change", () => resultOutput.value = "");
document.addEventListener("DOMContentLoaded", populateLanguages);
