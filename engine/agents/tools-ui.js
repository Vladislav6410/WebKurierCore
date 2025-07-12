// === tools-ui.js ===
// Интерфейс панели инструментов с галереей, генерацией и озвучкой

import * as toolsAgent from './tools-agent.js';
import { VoiceAgent } from './voice-agent.js';

window.toolsAgent = toolsAgent;
window.VoiceAgent = VoiceAgent;

export async function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 20px; background: #f4f4f4; border-top: 2px solid #ccc;";

  // Загрузка шаблонов
  let templates = [];
  try {
    const res = await fetch('./engine/agents/tools/templates.json');
    templates = await res.json();
  } catch (e) {
    console.error("❌ Не удалось загрузить templates.json", e);
  }

  // Галерея блоков
  const gallery = templates.map(tpl => `
    <div style="border:1px solid #aaa; border-radius:8px; margin:10px; padding:10px; background:#fff; max-width:240px;">
      <img src="./engine/agents/tools/previews/${tpl.preview}" alt="${tpl.title}" style="width:100%; border-radius:4px;">
      <strong>${tpl.title}</strong><br>
      <small>${tpl.description}</small><br>
      <button onclick='insertTemplate(${JSON.stringify(tpl.html)})' style="margin-top:6px;">📥 Вставить</button>
    </div>
  `).join('');

  container.innerHTML = `
    <h2>🛠 Панель инструментов WebKurierCore</h2>

    <div style="margin-bottom:12px;">
      <label>🧠 Генерация по описанию:</label><br>
      <input type="text" id="gen-description" placeholder="Например: кнопка с надписью Отправить" style="width:100%; padding:10px;">
      <button onclick="toolsAgent.generateFromDescription()">🧠 Сгенерировать</button>
    </div>

    <textarea id="html-preview" rows="10" style="width:100%; font-family:monospace;"></textarea><br><br>

    <input type="file" id="upload-html" accept=".html"><br><br>

    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
      ${gallery}
    </div>

    <br>
    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить HTML</button>
    <button onclick="toolsAgent.exportZip()">📦 Экспорт ZIP</button>
    <button onclick="toolsAgent.showManual()">📘 Инструкция</button>
    <button onclick="VoiceAgent.speakPreview()">🎙 Озвучить</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);
  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}

// 📥 Вставка HTML шаблона
window.insertTemplate = function (html) {
  const textarea = document.getElementById("html-preview");
  textarea.value += '\n' + html;
};