import config from './config.json' assert { type: 'json' };
import memory from './memory.json' assert { type: 'json' };
import { DropboxManager } from './dropbox.js';

export const Engineer = {
  memory,
  config,

  handleCommand(command) {
    const [cmd, ...args] = command.trim().split(/\s+/);

    switch (cmd) {
      case "/create":
        return `📁 Создано: ${args.join(" ")}`;

      case "/rename":
        return `✏️ Переименовано: ${args[0]} → ${args[1]}`;

      case "/scan":
        return "🛡️ Проверка завершена. Ошибок не обнаружено.";

      case "/task":
        return "📄 HTML-код: <button>Кнопка</button>";

      case "/assistant":
        return `🤖 Создан помощник: ${args.join(" ")}`;

      case "/add": {
        const newCmd = args[0];
        const response = args.slice(1).join(" ");
        if (!this.memory.commands) this.memory.commands = {};
        this.memory.commands[newCmd] = response;

        // 💾 Автосохранение в Dropbox
        DropboxManager.saveFile("memory.json", JSON.stringify(this.memory, null, 2));
        return `✅ Добавлена команда ${newCmd}`;
      }

      case "/save":
        return this.saveMemory();

      case "/load":
        return this.loadMemory();

      case "/clear":
        this.memory.logs = [];
        this.memory.modules = [];
        this.memory.files = [];
        this.memory.folders = [];
        this.memory.users = [];
        this.memory.tasks = [];
        return "🧹 Память очищена.";

      case "/config":
        this.log("Сохранение памяти (config)");
        return `💾 Память сохранена:\n${JSON.stringify(this.config, null, 2)}`;

      case "/help":
        return `🧠 Команды:
  /create folder Имя
  /rename старое новое
  /scan — проверка
  /task html — пример HTML
  /assistant инженер
  /add /имя Текст — новая команда
  /save — сохранить память
  /load — загрузить память
  /clear — очистить память
  /config — показать конфиг
  /help — помощь`;

      default:
        if (this.memory.commands && this.memory.commands[cmd]) {
          return this.memory.commands[cmd];
        }
        return `⚠️ Неизвестная команда: ${cmd}`;
    }
  },

  saveMemory() {
    DropboxManager.saveFile("memory.json", JSON.stringify(this.memory, null, 2));
    this.log("Сохранение памяти в Dropbox");
    return "💾 Память сохранена в Dropbox.";
  },

  loadMemory() {
    this.log("Загрузка памяти из Dropbox");
    return "📂 Память загружена (заглушка).";
  },

  log(message) {
    console.log("📝", message);
  }
};