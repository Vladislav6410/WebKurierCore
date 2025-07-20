// 📁 engine/agents/accountant/flags.js

function renderLanguageFlags(containerId = "lang-flags") {
  const flags = {
    de: "🇩🇪",
    ru: "🇷🇺",
    en: "🇬🇧",
    pl: "🇵🇱"
  };

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  Object.entries(flags).forEach(([code, emoji]) => {
    const btn = document.createElement("button");
    btn.innerText = emoji;
    btn.style.fontSize = "24px";
    btn.style.margin = "5px";
    btn.onclick = () => {
      i18nInit(code);
      localStorage.setItem("lang", code);
    };
    container.appendChild(btn);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("lang") || "de";
  i18nInit(lang);
  renderLanguageFlags();
});