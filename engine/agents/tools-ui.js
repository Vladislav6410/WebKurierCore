// === tools-ui.js ===
// Интерфейс панели инструментов с галереей и озвучкой

import * as toolsAgent from './tools-agent.js';
import { VoiceAgent } from './voice-agent.js';
window.toolsAgent = toolsAgent;
window.VoiceAgent = VoiceAgent;

export async function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 20px; background: #eee; border: 1px solid #ccc;";

  // Загрузка шаблонов
  let templates = [];
  try {
    const res = await fetch('./engine/agents/tools/templates.json');
    templates = await res.json();
  } catch (e) {
    console.error("Не удалось загрузить templates.json", e);
  }

  // Генерация HTML галереи
  const gallery = templates.map(tpl => `
    <div style="border:1px solid #aaa; border-radius:8px; margin:10px; padding:10px; background:#fff; max-width:220px;">
      <img src="./engine/agents/tools/previews/${tpl.preview}" alt="${tpl.title}" style="width:100%; border-radius:4px;">
      <strong>${tpl.title}</strong><br>
      <small>${tpl.description}</small><br>
      <button onclick='insertTemplate(${JSON.stringify(tpl.html)})' style="margin-top:6px;">📥 Вставить</button>
    </div>
  `).join('');

  // HTML интерфейс
  container.innerHTML = `
    <h2>🧰 Панель инструментов</h2>
    <input type="file" id="upload-html" accept=".html"><br><br>

    <label>🧠 Генерация по описанию:</label><br>
    <input type="text" id="desc-input" placeholder="Например: кнопка с надписью Отправить" style="width:100%;"><br>
    <button onclick="toolsAgent.generateFromDescription()">⚙️ Сгенерировать</button>
    <br><br>

    <textarea id="html-preview" rows="10" style="width:100%; font-family: monospace;"></textarea><br><br>

    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
      ${gallery}
    </div>

    <br>
    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить HTML</button>
    <button onclick="toolsAgent.exportToZip()">📦 Экспорт ZIP</button>
    <button onclick="toolsAgent.speakPreview()">🎙 Озвучить</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);
  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}

// Глобальная вставка шаблона
window.insertTemplate = function (html) {
  document.getElementById("html-preview").value = html;
};