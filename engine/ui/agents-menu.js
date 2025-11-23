// engine/ui/agents-menu.js

(async function () {
  const CONFIG_URL = 'engine/config/agents_map.json';

  // TODO: заменить на реальные данные о пользователе
  // например, подгружать из /api/me или из глобального объекта
  const userLang = (navigator.language || 'en').startsWith('ru') ? 'ru' : 'en';

  // Пример прав доступа (заглушка)
  // groups: id групп, к которым есть доступ
  // agents: id агентов, если хочешь детальнее
  const userAccess = {
    groups: ['communication', 'romantic', 'finance', 'drone'], // пример
    agents: ['translator', 'voice', 'lessons', 'romantic', 'wallet'] // пример
  };

  function hasGroupAccess(group) {
    if (group.access === 'internal') return false; // обычным пользователям не показываем
    // позже можно учитывать платные/бесплатные уровни, WebCoin и т.п.
    return true; // пока показываем все "не internal"
  }

  function hasAgentAccess(agentId) {
    // если хочешь строгий контроль по агентам — включи проверку
    // return userAccess.agents.includes(agentId);
    return true; // на первом шаге показываем всех агентов группы
  }

  function translateTitle(titleObj) {
    if (!titleObj) return '';
    return titleObj[userLang] || titleObj.en || Object.values(titleObj)[0] || '';
  }

  function createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'agent-group-card';

    const header = document.createElement('div');
    header.className = 'agent-group-header';

    const titleWrap = document.createElement('div');
    titleWrap.style.display = 'flex';
    titleWrap.style.alignItems = 'center';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'agent-group-icon';
    iconSpan.textContent = group.icon || '⚙️';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'agent-group-title';
    titleSpan.textContent = translateTitle(group.title);

    titleWrap.appendChild(iconSpan);
    titleWrap.appendChild(titleSpan);

    const accessBadge = document.createElement('span');
    accessBadge.className = 'agent-access-badge';
    accessBadge.textContent = group.access || 'public';

    header.appendChild(titleWrap);
    header.appendChild(accessBadge);

    const desc = document.createElement('div');
    desc.className = 'agent-group-desc';
    desc.style.fontSize = '0.8rem';
    desc.style.opacity = '0.75';
    desc.textContent = group.description ? translateTitle(group.description) : '';

    const agentsWrap = document.createElement('div');
    agentsWrap.className = 'agent-group-agents';

    (group.agents || []).forEach(agent => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'agent-chip';

      const title = translateTitle(agent.title);
      chip.textContent = (agent.icon || '') + ' ' + title;

      if (!hasAgentAccess(agent.id)) {
        chip.classList.add('disabled');
      } else if (agent.route) {
        chip.addEventListener('click', () => {
          // простая навигация: можешь заменить на router.navigate(...)
          window.location.href = agent.route;
        });
      }

      agentsWrap.appendChild(chip);
    });

    card.appendChild(header);
    if (desc.textContent.trim()) {
      card.appendChild(desc);
    }
    card.appendChild(agentsWrap);

    return card;
  }

  async function initAgentsMenu() {
    const container = document.getElementById('agents-menu');
    if (!container) return;

    try {
      const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Failed to load agents_map.json');
      const config = await res.json();

      const groups = (config.groups || []).filter(hasGroupAccess);

      container.innerHTML = ''; // на всякий

      groups.forEach(group => {
        const card = createGroupCard(group);
        container.appendChild(card);
      });
    } catch (err) {
      console.error('Agents menu init error:', err);
      container.innerHTML = '<div style="opacity:0.6;font-size:0.9rem;">Failed to load agents configuration.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', initAgentsMenu);
})();