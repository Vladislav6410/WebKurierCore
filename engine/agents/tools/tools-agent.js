// === tools-agent.js ===
// Агент обработки инструментов WebKurierCore

console.log("🛠 tools-agent.js загружен");

export function showToolsPanel() {
  const panel = document.getElementById("tools-panel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
}

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

export function saveHTMLContent() {
  const content = document.getElementById("html-preview").value;
  const blob = new Blob([content], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exported.html";
  a.click();
}

export function exportToZip() {
  const html = document.getElementById("html-preview").value;
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.generateAsync({ type: "blob" }).then(function (content) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "project.zip";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 0);
  });
}

export function insertTemplate() {
  const select = document.getElementById("template-select");
  const value = select.value;
  const textarea = document.getElementById("html-preview");
  if (value) textarea.value += "\n" + value;
}

export function generateFromDescription() {
  const input = document.getElementById("desc-input").value.toLowerCase();
  let html = '';
  if (input.includes("кнопка")) {
    const text = input.match(/кнопка с надписью (.+)/)?.[1] || "Кнопка";
    html = `<button>${text}</button>`;
  } else if (input.includes("заголовок")) {
    html = `<h1>Заголовок</h1>`;
  } else if (input.includes("список")) {
    html = `<ul><li>Пункт 1</li><li>Пункт 2</li></ul>`;
  } else if (input.includes("форма")) {
    html = `<form><input type='text' placeholder='Логин'><br><input type='password' placeholder='Пароль'><br><button>Войти</button></form>`;
  } else {
    html = "<!-- Не удалось распознать описание -->";
  }
  document.getElementById("html-preview").value += "\n" + html;
}

// 🔁 Глобальная вставка из шаблона
window.insertTemplate = function (html) {
  document.getElementById("html-preview").value = html;
};