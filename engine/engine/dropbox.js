// engine/dropbox.js — управление файлами через Dropbox

export const DropboxManager = {
  saveFile(name, content) {
    console.log(`💾 Сохраняем файл "${name}" в Dropbox`);
    // TODO: реализовать fetch к Dropbox API
  },

  loadFile(name) {
    console.log(`📂 Загружаем файл "${name}" из Dropbox`);
    // TODO: реализовать fetch к Dropbox API
  }
};