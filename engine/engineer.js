// === WebKurier Engineer v1.0 ===
// Файл: /engine/engineer.js

console.log("🔧 Engineer.js загружен");

// 🔗 Dropbox-ссылка на общую папку (режим dl=1 для прямого доступа)
const DROPBOX_BASE_URL = "https://www.dropbox.com/scl/fi";

// === Обработка команд ===
async function handleEngineerCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1];

  switch (cmd) {
    case "/help":
      return "📘 Команды:\n/save, /load, /add [текст], /config, /clear";

    case "/save":
      return saveMemory();

    case "/load":
      return loadMemory();

    case "/add":
      if (!arg) return "❗ Укажи текст для добавления.";
      return addMemoryEntry(arg);

    case "/config":
      return loadConfig();

    case "/clear":
      localStorage.clear();
      return "🧹 Память и конфиг очищены.";

    default:
      return "❓ Неизвестная команда. Введи /help";
  }
}

// === Работа с памятью ===
function saveMemory() {
  const data = {
    updated: new Date().toISOString(),
    notes: localStorage.getItem("engine_notes") || ""
  };
  localStorage.setItem("memory_data", JSON.stringify(data));
  return "💾 Память сохранена.";
}

function loadMemory() {
  const data = JSON.parse(localStorage.getItem("memory_data") || "{}");
  return data.notes
    ? `📂 Память:\n${data.notes}`
    : "📂 Память пуста.";
}

function addMemoryEntry(note) {
  const current = localStorage.getItem("engine_notes") || "";
  const updated = current + "\n" + note;
  localStorage.setItem("engine_notes", updated);
  return "✅ Запись добавлена.";
}

// === Загрузка config.json из Dropbox ===
async function loadConfig() {
  const url = `${DROPBOX_BASE_URL}/r6dgaq7p74m6myuk57n4i/config.json?rlkey=z23boiy3e7qcr5ruahd81kz1j&st=ci8hqv4x&dl=1`;
  try {
    const res = await fetch(url);
    const cfg = await res.json();
    return `⚙️ Config:\n` + JSON.stringify(cfg, null, 2);
  } catch (e) {
    return "⚠️ Ошибка загрузки config.json";
  }
}