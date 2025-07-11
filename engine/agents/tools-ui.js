// === tools-ui.js ===
// Интерфейс панели инструментов

export function renderToolsPanel() {
  const container = document.createElement("div");
  container.id = "tools-panel";
  container.style = "display: none; padding: 10px; background: #eee; border: 1px solid #ccc; margin-top: 10px;";

  container.innerHTML = `
    <h3>🧰 Панель инструментов</h3>
    <input type="file" id="upload-html" accept=".html">
    <br><br>
    <textarea id="html-preview" rows="10" style="width:100%; font-family: monospace;"></textarea>
    <br><br>
    <button onclick="toolsAgent.saveHTMLContent()">💾 Сохранить HTML</button>
    <button onclick="document.getElementById('tools-panel').style.display='none'">❌ Закрыть</button>
  `;

  document.body.appendChild(container);

  document.getElementById("upload-html").addEventListener("change", toolsAgent.loadHTMLFile);
}