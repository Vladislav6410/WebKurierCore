// editor.js — модуль редактора JSON

export function setupJsonEditor() {
  const selector = document.getElementById('json-selector');
  if (selector) {
    selector.addEventListener('change', () => {
      const file = selector.value;
      if (file) loadJsonFile(file);
    });
  }
}

export function openJsonEditor(filename) {
  const editor = document.getElementById('json-editor');
  const selector = document.getElementById('json-selector');
  editor.style.display = 'block';

  if (selector) {
    selector.value = filename;
  }

  loadJsonFile(filename);
}

export function closeJsonEditor() {
  const editor = document.getElementById('json-editor');
  editor.style.display = 'none';
}

export function loadJsonFile(filename) {
  const area = document.getElementById('json-area');
  if (!filename) return;

  fetch(`translations/${filename}`)
    .then(res => {
      if (!res.ok) throw new Error(`Ошибка загрузки файла ${filename}`);
      return res.text();
    })
    .then(text => {
      try {
        const parsed = JSON.parse(text);
        area.value = JSON.stringify(parsed, null, 2);
      } catch (e) {
        area.value = text; // если JSON кривой — показываем как есть
      }
    })
    .catch(err => {
      area.value = `// ❌ Не удалось загрузить файл: ${err.message}`;
    });
}

export function saveJsonFile() {
  const area = document.getElementById('json-area');
  const selector = document.getElementById('json-selector');
  const filename = selector.value;
  const content = area.value;

  try {
    JSON.parse(content); // проверка на валидный JSON
  } catch (e) {
    alert("❌ Ошибка: JSON содержит синтаксические ошибки");
    return;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || 'translation.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}