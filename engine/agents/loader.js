/**
 * loader.js
 * Загружает конфиг агентов (engine/config/agents.json)
 * и рендерит кнопки для UI.
 */

export async function renderAgentButtons(container, onClick) {
  try {
    const config = await fetch('./engine/config/agents.json').then(r => {
      if (!r.ok) throw new Error(`Не удалось загрузить конфиг агентов: ${r.status}`);
      return r.json();
    });

    if (!config?.agents) {
      container.innerHTML = '<p style="color:red;">Не найдено поле "agents" в конфиге</p>';
      return;
    }

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаём кнопки для каждого агента
    Object.entries(config.agents).forEach(([key, meta]) => {
      if (meta.enabled) {
        const btn = document.createElement('button');
        btn.className = 'agent-btn';
        btn.innerHTML = `${meta.icon ? meta.icon + ' ' : ''}${meta.name}`;
        btn.style.margin = '5px';
        btn.style.padding = '8px 12px';
        btn.style.border = '1px solid #ccc';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.background = '#f8f8f8';
        btn.style.fontSize = '14px';

        btn.addEventListener('click', async () => {
          try {
            // Динамически импортируем модуль агента
            const mod = await import(`./${meta.path}`);
            onClick?.(key, meta, mod);
          } catch (err) {
            console.error(`Ошибка при загрузке агента ${key}:`, err);
            alert(`Не удалось загрузить агента "${meta.name}"`);
          }
        });

        container.appendChild(btn);
      }
    });
  } catch (err) {
    console.error('Ошибка загрузки конфигурации агентов:', err);
    container.innerHTML = '<p style="color:red;">Ошибка загрузки агентов</p>';
  }
}