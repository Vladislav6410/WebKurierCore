// === WebKurier Engineer v1.0 ===
// Файл: /engine/engineer.js

console.log("🔧 Engineer.js загружен");

async function handleEngineerCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1];

  switch (cmd) {
    case "/help":
      return "📘 Команды:\n/save, /load, /add [ключ], /config, /clear";

    case "/save":
      return saveMemory();

    case "/load":
      return loadMemory();

    case "/add":
      if (!arg) return "❗ Укажи ключ для добавления.";
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
async function saveMemory() {
  const data = {
    updated: new Date().toISOString(),
    notes: localStorage.getItem("engine_notes") || ""
  };
  localStorage.setItem("memory_data", JSON.stringify(data));
  return "💾 Память сохранена.";
}

async function loadMemory() {
  const data = JSON.parse(localStorage.getItem("memory_data") || "{}");
  return data.notes
    ? `📂 Память: ${data.notes}`
    : "📂 Память пуста.";
}

function addMemoryEntry(note) {
  const current = localStorage.getItem("engine_notes") || "";
  const updated = current + "\n" + note;
  localStorage.setItem("engine_notes", updated);
  return "✅ Запись добавлена.";
}

// === Работа с config.json ===
async function loadConfig() {
  try {
    const res = await fetch("engine/config.json");
    const cfg = await res.json();
    return `⚙️ Config:\n` + JSON.stringify(cfg, null, 2);
  } catch (e) {
    return "⚠️ Ошибка загрузки config.json";
  }
}