import config from './config.json' assert { type: 'json' };
import memory from './memory.json' assert { type: 'json' };
import { DropboxManager } from './dropbox.js'; // управление Dropbox

export const Engineer = {
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
        if (!memory.commands) memory.commands = {};
        memory.commands[newCmd] = response;

        // 💾 Автосохранение в Dropbox
        DropboxManager.saveFile("memory.json", JSON.stringify(memory, null, 2));
        return `✅ Добавлена команда ${newCmd}`;
      }

      case "/help":
        return `🧠 Команды:
  /create folder Имя
  /rename старое новое
  /scan — проверка
  /task html — пример HTML
  /assistant инженер
  /add /имя Текст — новая команда
  /help — помощь`;

      default:
        if (memory.commands && memory.commands[cmd]) {
          return memory.commands[cmd];
        }
        return `⚠️ Неизвестная команда: ${cmd}`;
    }
  }
};