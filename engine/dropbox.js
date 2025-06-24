// engine/dropbox.js

const DROPBOX_ACCESS_TOKEN = 'ТОКЕН_СЮДА'; // Вставь сюда свой токен доступа Dropbox API

const dbx = new Dropbox.Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });

async function downloadFileFromDropbox(path) {
  try {
    const response = await dbx.filesDownload({ path });
    const blob = response.result.fileBlob;
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Ошибка загрузки с Dropbox:", error);
    return null;
  }
}

async function uploadFileToDropbox(path, content) {
  try {
    await dbx.filesUpload({
      path,
      contents: JSON.stringify(content, null, 2),
      mode: 'overwrite'
    });
    console.log("Файл успешно сохранён в Dropbox:", path);
  } catch (error) {
    console.error("Ошибка сохранения в Dropbox:", error);
  }
}

// Пример: загрузка памяти и конфигурации
async function loadMemoryFromDropbox() {
  return await downloadFileFromDropbox('/engine/memory.json');
}

async function loadConfigFromDropbox() {
  return await downloadFileFromDropbox('/engine/config.json');
}

// Пример: экспорт из engineer.js
if (typeof window !== 'undefined') {
  window.dropbox = {
    loadMemoryFromDropbox,
    loadConfigFromDropbox,
    uploadFileToDropbox
  };
}