// === dream.js — логика DreamMaker ===

console.log("✨ DreamMaker подключён");

function initDreamMaker() {
  const root = document.getElementById("dreammaker-root");
  if (!root) return;

  root.innerHTML = `
    <div class="dream-box">
      <h3>🎨 DreamMaker</h3>
      <button onclick="alert('🎤 Запись...')">🎤 Озвучить</button>
      <button onclick="alert('🎥 Создание 3D...')">📸 Оживить фото</button>
      <button onclick="alert('🔊 Загрузка звука...')">🎵 Добавить MP3</button>
    </div>
  `;
}
window.addEventListener("DOMContentLoaded", initDreamMaker);