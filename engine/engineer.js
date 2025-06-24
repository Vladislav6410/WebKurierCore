// === WebKurier Engineer v2.1 ===
// Файл: /engine/engineer.js

console.log("🔧 Engineer.js загружен");

let memory = {};
let config = {};

// === Обработка команд терминала ===
async function handleEngineerCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts.slice(1).join(" ");

  switch (cmd) {
    case "/help":
      return `📘 Команды:
  /save — сохранить память
  /load — загрузить память
  /add [текст] — добавить заметку
  /config — загрузить конфиг
  /clear — очистить память
  /help — показать команды`;

    case "/save":
      return await saveMemory();

    case "/load":
      return await loadMemory();

    case "/add":
      if (!arg) return "❗ Укажи текст для добавления.";
      return addMemoryEntry(arg);

    case "/config":
      return await loadConfig();

    case "/clear":
      memory = {};
      localStorage.removeItem("memory_data");
      return "🧹 Память очищена.";

    default:
      return "❓ Неизвестная команда. Введи /help";
  }
}

// === Сохранение памяти в Dropbox и локально ===
async function saveMemory() {
  const data = {
    updated: new Date().toISOString(),
    notes: memory.notes || ""
  };

  try {
    localStorage.setItem("memory_data", JSON.stringify(data));
    await dropbox.uploadFileToDropbox("/engine/memory.json", data);
    return "💾 Память сохранена в Dropbox и localStorage.";
  } catch (e) {
    return "⚠️ Ошибка при сохранении: " + e.message;
  }
}

// === Загрузка памяти: сначала Dropbox, потом локально ===
async function loadMemory() {
  try {
    const remote = await dropbox.loadMemoryFromDropbox();
    if (remote && remote.notes !== undefined) {
      memory = remote;
      localStorage.setItem("memory_data", JSON.stringify(remote));
      return `📂 Память (из Dropbox):\n${remote.notes}`;
    }
  } catch (e) {
    console.warn("Ошибка Dropbox:", e.message);
  }

  const local = JSON.parse(localStorage.getItem("memory_data") || "{}");
  memory = local;
  return local.notes
    ? `📂 Локальная память:\n${local.notes}`
    : "📂 Память пуста.";
}

// === Добавление заметки ===
function addMemoryEntry(note) {
  const current = memory.notes || "";
  memory.notes = (current ? current + "\n" : "") + note;
  localStorage.setItem("memory_data", JSON.stringify(memory));
  return "✅ Запись добавлена.";
}

// === Загрузка конфигурации из Dropbox ===
async function loadConfig() {
  try {
    const remote = await dropbox.loadConfigFromDropbox();
    if (remote) {
      config = remote;
      return "⚙️ Конфиг загружен:\n" + JSON.stringify(config, null, 2);
    }
  } catch (e) {
    console.warn("Ошибка загрузки config:", e.message);
  }
  return "⚠️ Ошибка загрузки config.json";
}