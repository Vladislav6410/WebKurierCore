// === tools-ui.js ===
// Интерфейс панели инструментов WebKurierCore

import * as toolsAgent from './tools-agent.js';

export async function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 20px; background: #f9f9f9; border: 1px solid #ccc; margin-top: 20px;";

  // Загрузка templates.json
  let templates = [];
  try {
    const res = await fetch('./engine/agents/tools/templates.json');
    templates = await res.json();
  } catch (e) {
    console.error("❗ Не удалось загрузить templates.json", e);
  }

  // Генерация галереи шаблонов
  const gallery = templates.map(tpl => `
    <div style="border:1px solid #aaa; border-radius:8px; margin:10px; padding:10px; background:#fff; max-width:220px;">
      <img src="./engine/agents/tools/previews/${tpl.preview}" alt="${tpl.title}" style="width:100%; border-radius:4px;">
      <strong>${tpl.title}</strong><br>
      <small>${tpl.description}</small><br>
      <button onclick='insertTemplate(\`${tpl.html.replace(/`/g, "\\`")}\`)'>📥 Вставить</button>
    </div>
  `).join('');

  // Панель инструментов
  container.innerHTML = `
    <h2>🧰 Панель инструментов</h2>

    <input type="file" id="upload-html" accept=".html"><br><br>

    <textarea id="html-preview" rows="12" style="width:100%; font-family:monospace;"></textarea><br><br>

    <h3>🧱 Галерея шаблонов</h3>
    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">${gallery}</div>

    <br>
    <h3>🧠 Генерация по описанию</h3>
    <input type="text" id="desc-input" placeholder="например: кнопка с надписью Отправить" style="width:100%; padding:6px;"><br><br>
    <button onclick="toolsAgent.generateFromDescription()">⚙️ Сгенерировать</button>

    <br><br>
    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить HTML</button>
    <button onclick="toolsAgent.exportToZip()">📦 Экспорт ZIP</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);
  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}