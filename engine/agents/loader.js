// engine/agents/loader.js
// Загружает engine/config/agents.json и динамически импортирует включённых агентов

const CONFIG_URL = '/engine/config/agents.json';            // путь до конфига
const AGENTS_BASE = '/engine/agents/';                      // базовая папка с агентами

/**
 * Загружает конфиг и возвращает:
 * {
 *   config,                      // исходный JSON
 *   enabled: Map<key, meta>,     // включённые описания
 *   instances: Map<key, module>  // подключённые модули агентов
 * }
 */
export async function loadAgents() {
  // 1) читаем конфиг
  const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить ${CONFIG_URL}: ${res.status} ${res.statusText}`);
  }
  const config = await res.json();

  // 2) фильтруем включённых
  const enabled = new Map(
    Object.entries(config.agents || {}).filter(([, a]) => a?.enabled)
  );

  // 3) динамически импортируем модули
  const instances = new Map();
  for (const [key, meta] of enabled) {
    const url = AGENTS_BASE + (meta.path || '').replace(/^\/*/, ''); // нормализуем путь
    try {
      const mod = await import(url);
      instances.set(key, mod);
      console.info(`✅ Загрузили агента "${meta.name}" из ${url}`);
    } catch (e) {
      console.error(`❌ Ошибка импорта агента "${meta?.name}" (${url})`, e);
    }
  }

  return { config, enabled, instances };
}

/**
 * Хелпер: создает кнопки по включённым агентам и вешает обработчик клика.
 * @param {HTMLElement} container — куда рисовать
 * @param {(key:string, meta:object, mod:any)=>void} onClick — обработчик
 */
export async function renderAgentButtons(container, onClick) {
  const { enabled, instances, config } = await loadAgents();
  container.innerHTML = ''; // очистим

  for (const [key, meta] of enabled) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'agent-btn';
    btn.textContent = meta.name || key;
    btn.addEventListener('click', () => onClick?.(key, meta, instances.get(key)));
    container.appendChild(btn);
  }

  return { enabled, instances, config };
}