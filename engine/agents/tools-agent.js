// === tools-agent.js ===
// Агент для обработки действий инструментов

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