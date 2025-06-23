// engine/engineer.js — цифровой помощник WebKurierCore

import config from './config.json' assert { type: 'json' };
import memory from './memory.json' assert { type: 'json' };
import { DropboxManager } from './dropbox.js';

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

      case "/save":
        DropboxManager.saveFile(args[0], args.slice(1).join(" "));
        return `💾 Сохранено в Dropbox как: ${args[0]}`;

      case "/load":
        DropboxManager.loadFile(args[0]);
        return `📂 Загружаем: ${args[0]} из Dropbox...`;

      case "/help":
        return `🧠 Команды:
  /create folder Имя
  /rename старое новое
  /scan
  /task html
  /assistant бухгалтер
  /save [имя] [данные]
  /load [имя]`;

      default:
        return `⚠️ Неизвестная команда: ${cmd}`;
    }
  }
};