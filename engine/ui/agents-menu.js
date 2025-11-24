// engine/ui/agents-menu.js
// Строит плитки агентов по конфигу engine/config/agents_map.json

(function () {
  const CONFIG_URL = "engine/config/agents_map.json";

  const container = document.getElementById("agents-menu");
  const titleEl = document.getElementById("agents-title");
  if (!container) {
    console.warn("[agents-menu] #agents-menu not found");
    return;
  }

  // Определяем язык интерфейса
  const htmlLang = (document.documentElement.lang || "ru").toLowerCase();
  const LANG = htmlLang.startsWith("ru") ? "ru" : "en";

  // Подписи для бейджа доступа
  const ACCESS_LABELS = {
    base: { ru: "Базовый доступ", en: "Base access" },
    pro: { ru: "Pro доступ", en: "Pro access" },
    admin: { ru: "Админ", en: "Admin" }
  };

  // Обновим заголовок секции, если есть
  if (titleEl) {
    titleEl.textContent =
      LANG === "ru" ? "Агенты WebKurier" : "WebKurier Agents";
  }

  async function loadConfig() {
    try {
      const res = await fetch(CONFIG_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      renderAgents(data);
    } catch (err) {
      console.error("[agents-menu] config load error:", err);
      container.innerHTML =
        LANG === "ru"
          ? "Ошибка загрузки списка агентов."
          : "Failed to load agents configuration.";
    }
  }

  function renderAgents(cfg) {
    container.innerHTML = "";

    if (!cfg || !Array.isArray(cfg.groups)) {
      container.textContent =
        LANG === "ru"
          ? "Неверный формат конфигурации агентов."
          : "Invalid agents configuration format.";
      return;
    }

    cfg.groups.forEach((group) => {
      if (!group || !Array.isArray(group.agents)) return;

      const card = document.createElement("div");
      card.className = "agent-group-card";

      // Заголовок группы
      const header = document.createElement("div");
      header.className = "agent-group-header";

      const titleWrap = document.createElement("div");
      const iconSpan = document.createElement("span");
      iconSpan.className = "agent-group-icon";
      iconSpan.textContent = group.icon || "•";

      const titleSpan = document.createElement("span");
      titleSpan.className = "agent-group-title";
      const groupTitle = group.title && (group.title[LANG] || group.title["en"]);
      titleSpan.textContent = groupTitle || group.id || "Group";

      titleWrap.appendChild(iconSpan);
      titleWrap.appendChild(titleSpan);

      const badge = document.createElement("span");
      badge.className = "agent-access-badge";

      const access = group.access || "base";
      const accessLabel =
        ACCESS_LABELS[access] && (ACCESS_LABELS[access][LANG] || ACCESS_LABELS[access]["en"]);
      badge.textContent = accessLabel || access;

      header.appendChild(titleWrap);
      header.appendChild(badge);

      card.appendChild(header);

      // Список агентов
      const agentsWrap = document.createElement("div");
      agentsWrap.className = "agent-group-agents";

      group.agents.forEach((agent) => {
        if (!agent || !agent.id) return;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "agent-chip";

        if (agent.icon) {
          chip.textContent = agent.icon + " ";
        } else {
          chip.textContent = "";
        }

        const title =
          agent.title && (agent.title[LANG] || agent.title["en"] || agent.title["ru"]);
        chip.textContent += title || agent.id;

        const enabled = agent.enabled !== false; // по умолчанию true
        const route = agent.route || "#";

        if (!enabled || route === "#") {
          chip.classList.add("disabled");
        } else {
          chip.addEventListener("click", () => {
            // навигация к HTML-ядру агента
            window.location.href = route;
          });
        }

        agentsWrap.appendChild(chip);
      });

      card.appendChild(agentsWrap);
      container.appendChild(card);
    });
  }

  loadConfig();
})();