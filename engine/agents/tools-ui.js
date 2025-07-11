export async function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 24px; background: #eee; border: 1px solid #ccc; margin-top: 20px;";

  // Загрузка шаблонов
  let templates = [];
  try {
    const res = await fetch('./engine/agents/tools/templates.json');
    templates = await res.json();
  } catch (e) {
    console.error("Не удалось загрузить templates.json", e);
  }

  let galleryHtml = templates.map(tpl => `
    <div style="border: 1px solid #aaa; border-radius: 6px; padding: 10px; margin: 6px; background: #fafafa;">
      <strong>${tpl.title}</strong><br>
      <small>${tpl.description}</small><br>
      <button onclick='insertTemplate(${JSON.stringify(tpl.html)})'>📥 Вставить</button>
    </div>
  `).join('');

  container.innerHTML = `
    <h3>🛠 Панель инструментов</h3>

    <input type="file" id="upload-html" accept=".html"><br><br>
    <textarea id="html-preview" rows="10" style="width:100%; font-family:monospace;"></textarea><br><br>

    <input type="text" id="gen-description" placeholder="🧠 Опиши HTML-блок..." style="width:100%;">
    <button onclick="toolsAgent.generateFromDescription()">🧠 Сгенерировать</button><br><br>

    <div style="display: flex; flex-wrap: wrap; gap: 10px;">${galleryHtml}</div><br>

    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить</button>
    <button onclick="toolsAgent.exportZip()">📦 Экспорт ZIP</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);
  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}

// Глобальная функция вставки шаблона
window.insertTemplate = function (html) {
  document.getElementById("html-preview").value = html;
};