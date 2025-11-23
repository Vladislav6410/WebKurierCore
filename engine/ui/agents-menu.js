// engine/ui/agents-menu.js

(function () {
  const CONFIG_PATH = "engine/config/agents_map.json";

  function getLang() {
    try {
      const url = new URL(window.location.href);
      const lang = url.searchParams.get("lang");
      if (lang === "en" || lang === "ru") return lang;
    } catch (e) {
      // ignore
    }
    return "ru";
  }

  function getAccessLabel(access, lang) {
    const map = {
      ru: {
        base: "Базовый доступ",
        pro: "Pro доступ",
        admin: "Только админ"
      },
      en: {
        base: "Base access",
        pro: "Pro access",
        admin: "Admin only"
      }
    };
    const dict = map[lang] || map["ru"];
    return dict[access] || access;
  }

  function translateTitle(titleObj, lang) {
    if (!titleObj) return "";
    if (titleObj[lang]) return titleObj[lang];
    return titleObj["ru"] || titleObj["en"] || "";
  }

  function buildAgentsMenu(config) {
    const lang = getLang();
    const menuRoot = document.getElementById("agents-menu");
    const titleEl = document.getElementById("agents-title");

    if (!menuRoot) {
      console.warn("agents-menu.js: #agents-menu not found on this page.");
      return;
    }

    // Обновим заголовок при желании
    if (titleEl) {
      titleEl.textContent =
        lang === "en" ? "WebKurier Agents" : "Агенты WebKurier";
    }

    menuRoot.innerHTML = "";

    if (!config || !Array.isArray(config.groups)) {
      menuRoot.textContent =
        lang === "en"
          ? "No agent groups defined."
          : "Группы агентов не найдены.";
      return;
    }

    config.groups.forEach((group) => {
      const card = document.createElement("div");
      card.className = "agent-group-card";

      // Header
      const header = document.createElement("div");
      header.className = "agent-group-header";

      const titleWrap = document.createElement("div");
      const iconSpan = document.createElement("span");
      iconSpan.className = "agent-group-icon";
      iconSpan.textContent = group.icon || "•";

      const titleSpan = document.createElement("span");
      titleSpan.className = "agent-group-title";
      titleSpan.textContent = translateTitle(group.title, lang) || group.id;

      titleWrap.appendChild(iconSpan);
      titleWrap.appendChild(titleSpan);

      const accessSpan = document.createElement("span");
      accessSpan.className = "agent-access-badge";
      accessSpan.textContent = getAccessLabel(group.access || "base", lang);

      header.appendChild(titleWrap);
      header.appendChild(accessSpan);
      card.appendChild(header);

      // Agents
      const agentsWrap = document.createElement("div");
      agentsWrap.className = "agent-group-agents";

      if (Array.isArray(group.agents)) {
        group.agents.forEach((agent) => {
          const chip = document.createElement("div");
          chip.className = "agent-chip";

          if (!agent.enabled) {
            chip.classList.add("disabled");
          }

          chip.innerHTML =
            (agent.icon ? agent.icon + " " : "") +
            (translateTitle(agent.title, lang) || agent.id);

          if (agent.enabled && agent.route) {
            chip.addEventListener("click", () => {
              try {
                const url = new URL(window.location.href);
                const langParam = url.searchParams.get("lang");
                let target = agent.route;
                if (langParam) {
                  // сохраняем ?lang=...
                  const sep = target.includes("?") ? "&" : "?";
                  target = target + sep + "lang=" + encodeURIComponent(langParam);
                }
                window.location.href = target;
              } catch (e) {
                // запасной вариант
                window.location.href = agent.route;
              }
            });
          }

          agentsWrap.appendChild(chip);
        });
      }

      card.appendChild(agentsWrap);
      menuRoot.appendChild(card);
    });
  }

  async function loadConfigAndBuild() {
    const menuRoot = document.getElementById("agents-menu");
    const lang = getLang();

    if (!menuRoot) return;

    menuRoot.textContent =
      lang === "en" ? "Loading agents..." : "Загрузка агентов...";

    try {
      const res = await fetch(CONFIG_PATH, {
        cache: "no-store"
      });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      const json = await res.json();
      buildAgentsMenu(json);
    } catch (err) {
      console.error("agents-menu.js: failed to load config:", err);
      menuRoot.textContent =
        lang === "en"
          ? "Failed to load agents_map.json."
          : "Не удалось загрузить agents_map.json.";
    }
  }

  document.addEventListener("DOMContentLoaded", loadConfigAndBuild);
})();