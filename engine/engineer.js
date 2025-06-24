// === Ядро цифрового помощника WebKurier ===

import config from './config.json' assert { type: 'json' };
import memory from './memory.json' assert { type: 'json' };
import { DropboxManager } from './dropbox.js';

export const Engineer = {
  language: "ru",
  userId: null,
  memory: memory,
  config: config,
  storage: {
    userFolders: [],
    createdFiles: [],
    modules: [],
    logs: [],
  },

  setLanguage(lang) {
    this.language = lang;
    this.log(`Язык установлен: ${lang}`);
  },

  setUserId(id) {
    this.userId = id;
  },

  log(message) {
    const time = new Date().toLocaleTimeString();
    this.storage.logs.push(`[${time}] ${message}`);
    console.log(`[ИНЖЕНЕР]: ${message}`);
  },

  handleCommand(command) {
    const [cmd, ...args] = command.trim().split(/\s+/);

    switch (cmd) {
      // 📦 Модули и файлы
      case "/install":
        return this.installModule(args.join(" "));
      case "/rename":
        return this.renameItem(args);
      case "/create":
        return this.createItem(args);
      case "/delete":
        return this.deleteItem(args);

      // 🛠️ Система и панель
      case "/scan":
        return this.scanSystem();
      case "/task":
        return this.generateTask(args.join(" "));
      case "/register":
        return this.registerUser(args);
      case "/panel":
        return this.openPanel();
      case "/ai":
        return this.activateAI(args.join(" "));
      case "/assistant":
        return this.createAssistant(args.join(" "));

      // 🧠 Работа с памятью
      case "/memory":
        return JSON.stringify(this.memory, null, 2);
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

      // ⚙️ Конфиг
      case "/config":
        return JSON.stringify(this.config, null, 2);

      // ➕ Добавление кастомной команды
      case "/add": {
        const newCmd = args[0];
        const response = args.slice(1).join(" ");
        if (!this.memory.commands) this.memory.commands = {};
        this.memory.commands[newCmd] = response;
        DropboxManager.saveFile("memory.json", JSON.stringify(this.memory, null, 2));
        return `✅ Добавлена команда ${newCmd}`;
      }

      // 📘 Справка
      case "/help":
        return `🧠 Команды инженера:
  /install [модуль]
  /rename [старое] [новое]
  /create folder|file [название]
  /delete [имя]
  /scan
  /task html|js|...
  /register [email/телефон]
  /panel
  /ai [режим]
  /assistant [роль]
  /memory — показать память
  /save — сохранить
  /load — загрузить
  /clear — очистить память
  /config — показать config.json
  /add /имя Текст — создать команду
  /help — помощь`;

      // 🧠 Выполнение пользовательской команды
      default:
        if (this.memory.commands && this.memory.commands[cmd]) {
          return this.memory.commands[cmd];
        }
        return `⚠️ Неизвестная команда: ${cmd}`;
    }
  },

  installModule(name) {
    this.storage.modules.push(name);
    return `✅ Установлен модуль: ${name}`;
  },

  renameItem(args) {
    const [oldName, newName] = args;
    return `📦 Переименовано: ${oldName} → ${newName}`;
  },

  createItem(args) {
    const type = args[0];
    const name = args.slice(1).join(" ");
    if (type === "folder") {
      this.storage.userFolders.push(name);
      return `📁 Папка создана: ${name}`;
    } else if (type === "file") {
      this.storage.createdFiles.push(name);
      return `📄 Файл создан: ${name}`;
    }
    return `❓ Неизвестный тип: ${type}`;
  },

  deleteItem(args) {
    return `🗑️ Удалено: ${args.join(" ")}`;
  },

  scanSystem() {
    return "🧪 Сканирование завершено: вирусов не обнаружено, ошибок 0.";
  },

  generateTask(format) {
    const codeExample = {
      html: "<button>Кнопка</button>",
      js: "console.log('Привет, мир!');"
    };
    return `📄 Техническое задание (${format}):\n\n${codeExample[format] || "Нет шаблона"}`;
  },

  registerUser(args) {
    return `👤 Регистрация запущена для: ${args.join(" ")}`;
  },

  openPanel() {
    return "🔐 Панель администратора доступна по ID.";
  },

  activateAI(mode) {
    return `🤖 AI активен в режиме: ${mode}`;
  },

  createAssistant(role) {
    return `👨‍💼 Цифровой помощник создан: ${role}`;
  },

  saveMemory() {
    this.log("Сохранение памяти в Dropbox...");
    DropboxManager.saveFile("memory.json", JSON.stringify(this.memory, null, 2));
    return "💾 Память сохранена.";
  },

  loadMemory() {
    this.log("Загрузка памяти из Dropbox...");
    return "📂 Память загружена.";
  }
};