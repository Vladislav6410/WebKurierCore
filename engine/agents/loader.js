/**
 * loader.js
 * Загружает конфиг агентов (engine/config/agents.json)
 * и рендерит кнопки для UI.
 */

export async function renderAgentButtons(container, onClick) {
  try {
    const res = await fetch('./engine/config/agents.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Не удалось загрузить конфиг агентов: ${res.status}`);
    const config = await res.json();

    if (!config || !config.agents) {
      container.innerHTML = '<p style="color:red;">Не найдено поле "agents" в конфиге</p>';
      return;
    }

    container.innerHTML = '';

    let rendered = 0;

    Object.entries(config.agents).forEach(([key, meta]) => {
      const enabled = meta?.enabled !== false; // по умолчанию включено
      if (!enabled) return;

      // ожидаем, что meta.path — имя файла, напр. "intelligence-agent.js"
      if (!meta?.path) return;

      const btn = document.createElement('button');
      btn.className = 'agent-button';                         // <-- совпадает со стилями
      btn.type = 'button';
      btn.setAttribute('aria-label', meta.name || key);
      btn.innerHTML = `${meta.icon ? `${meta.icon} ` : ''}${meta.name || key}`;

      btn.addEventListener('click', async () => {
        try {
          // путь относительно engine/agents/loader.js
          const mod = await import(`./${meta.path}`);
          onClick?.(key, meta, mod);
        } catch (err) {
          console.error(`Ошибка при загрузке агента "${key}" из ${meta.path}:`, err);
          alert(`Не удалось загрузить агента "${meta.name || key}"`);
        }
      });

      container.appendChild(btn);
      rendered++;
    });

    if (!rendered) {
      container.innerHTML = '<p style="opacity:.7;">Нет активированных агентов.</p>';
    }
  } catch (err) {
    console.error('Ошибка загрузки конфигурации агентов:', err);
    container.innerHTML = '<p style="color:red;">Ошибка загрузки агентов</p>';
  }
}