export async function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 20px; background: #eee;";

  // Загружаем шаблоны
  let templates = [];
  try {
    const res = await fetch('./engine/agents/tools/templates.json');
    templates = await res.json();
  } catch (e) {
    console.error("Не удалось загрузить templates.json", e);
  }

  // Галерея блоков с превью
  const gallery = templates.map(tpl => `
    <div style="border:1px solid #aaa; border-radius:8px; margin:10px; padding:10px; background:#fff; max-width:220px;">
      <img src="./engine/agents/tools/previews/${tpl.preview}" alt="${tpl.title}" style="width:100%; border-radius:4px;">
      <strong>${tpl.title}</strong><br>
      <small>${tpl.description}</small><br>
      <button onclick='insertTemplate(${JSON.stringify(tpl.html)})' style="margin-top:6px;">📥 Вставить</button>
    </div>
  `).join('');

  container.innerHTML = `
    <h2>🧱 Галерея шаблонов</h2>
    <input type="file" id="upload-html" accept=".html"><br><br>
    <textarea id="html-preview" rows="10" style="width:100%; font-family:monospace;"></textarea><br><br>

    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">${gallery}</div>

    <br>
    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить HTML</button>
    <button onclick="toolsAgent.exportZip()">📦 Экспорт ZIP</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);
  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}

// Глобальная функция вставки
window.insertTemplate = function (html) {
  document.getElementById("html-preview").value = html;
};