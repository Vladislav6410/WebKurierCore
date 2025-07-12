// === tools-agent.js ===
// Агент для панели инструментов WebKurierCore

// 🧱 Показ / скрытие панели инструментов
export function showToolsPanel() {
  const panel = document.getElementById("tools-panel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
}

// 📘 Показ блока инструкции
export function showManual() {
  const block = document.getElementById("manual-block");
  if (block) {
    block.style.display = "block";
    block.scrollIntoView({ behavior: "smooth" });
  } else {
    alert("📘 Инструкция не найдена на странице.");
  }
}

// 📤 Загрузка HTML-файла
export function loadHTMLFile(event) {
  const file = event.target.files[0];
  if (file && file.type === "text/html") {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("html-preview").value = e.target.result;
    };
    reader.readAsText(file);
  }
}

// 💾 Сохранение HTML как .html
export function saveHTMLContent() {
  const content = document.getElementById("html-preview").value;
  const blob = new Blob([content], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exported.html";
  a.click();
}

// 🧠 Генерация HTML по описанию (AI-подсказка)
export function generateFromDescription() {
  const desc = document.getElementById("gen-description").value.trim().toLowerCase();
  let html = '';

  if (desc.includes("кнопка")) {
    const label = desc.split("надписью ")[1] || "Кнопка";
    html = `<button>${label}</button>`;
  } else if (desc.includes("заголовок")) {
    html = `<h1>Заголовок</h1>`;
  } else if (desc.includes("список")) {
    html = `<ul><li>Пункт 1</li><li>Пункт 2</li></ul>`;
  } else if (desc.includes("форма")) {
    html = `<form><input type='text' placeholder='Имя'><input type='password' placeholder='Пароль'><button>Войти</button></form>`;
  } else {
    html = "<!-- Не удалось распознать описание -->";
  }

  document.getElementById("html-preview").value += '\n' + html;
}

// 📦 Экспорт проекта в ZIP
export async function exportZip() {
  const zip = new JSZip();
  const content = document.getElementById("html-preview").value;
  zip.file("index.html", content);

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project.zip";
  a.click();
}