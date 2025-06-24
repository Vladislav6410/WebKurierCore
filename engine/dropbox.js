// engine/dropbox.js

const DROPBOX_ACCESS_TOKEN = 'sl.u.AFwSULjgPBkINc-zpZ4FnwF_ZYexEnZ9tZt29TA1FE-F2z7K-LbRKuviZQTpeE3bOiqlz3nf54ybjPZEWHfsjwIU7eL1KGinhnXxwF5suTdvr01z8H2VPc-TvhHvQOw1CJjlgIfZR389UgCpLmaCwwhcPh0xPctoGYgUcCO4x4Atmn4Zjz4ta7sBe_r5SqTyjmWD7T2NTOd3XDLe8FT6n087u71YkS_Kd3vBfRtbjJ7Er6w4CJ3qctCdh37-1im1WUQyUIQDPRPDVXm1b7rZK4k9OLJD4MORWE9nQqNAQ5AYMaqOO4tSXljMiUvS9qW9j6_nrn_7zfF-az3K2TQZ5hJT_GWIamPcpHJkio3WpD4uMLVaUDuzuxfZnnO5HcP9Any_5PVzSV8ErjFE9SOEPCg0PA24_3A5v6WDCiXaZf76ALnpMWRHhLr1lztKv2y7UDAdM23_KHT3HvKvyR9L-wiFm6ZhhhPmjEXC3jf26JyjvZScB3cngETp7XEbYfchsyhhKf5mAkxbhpmkqfkg0tNH-g15e9tozNlrLb03kBXy2szRY0MMlJYgmJCkm0EU9L7lqctO7uT5H4ZxKuiPjetNcuwAzOAg_76danRM9cufpfCbeEyFbo-bWPOwhLYIYAkxlOQQvIVDl8n1IsS7lhYsehveI07R-EStP5OQC65XkHWIxd6nn6oGM63trE62qmtKMn_t-KqxGz-JND20bHOeO1gNxj82eauAb4K9t5VgnlNEKCkWCne91PRethsa3FE1GS-iUyJ_59p-4zEmusiRYpGIW8GHi7rX8Hf9Zk2j0-Bqq10MdHi7UBkABu3WYIQ-JXMqI7TVGmH6k9v99N1DwqUw4_rNVUuSstnz6EOaWieTmiw67PcjR1-BBvCQ-lB0jPrIdNHbj71BqR_DxLbVRbldNDjqwXoACWycfstf1lpH33CWXcI6HVQ1fX8OXkeLvFnn7kgaH96RcdWcf3aUlQfvvMTa5Rwxi8duGeCeZh4fovPFWHBth9gAPkWQhEBRWkh5yaoQqoyOB37BpkU3OGyQMng4nJdQ4LctoniP7nkjKk9V_Us2YVxvf79DiT2F0N-5mreS6qT62LeRDxNRLTqZFgyQHzFOJpJtAoiOdGfvxDQ9wOpb5GZDGfRd_rCazQ5Sn0WzsgnJDK6l-8TvPesfEVQZXBYFl4233cxnFDlTp2ZzppNCtPX7SCglrq90rUOtUQft0d-4DCx2wuLMSe2AUvzdpOY6hqZjzgfg1ExlvLf2B0ci04yDcK_T1lZuaFIN_Jq6xiV6_M2JKdq1-p_CpEGEuaw9okhlCqEbjZej7-a8kBaf0yHwhEETvujHzldu81cVepw5SeLTxW8uIe9QQ_yxGMeoYklas_hw-NWPVKnWRE4OPqI3cOOaqz4McTob6Kqcwes8gY4SIWPvtD-zAdr15JIwxUjBveuwXRhoqAwJ0WURN-Fzcrp3EW8'; //

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