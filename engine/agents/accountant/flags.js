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

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage || "de";
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("pl")) return "pl";
  if (lang.startsWith("en")) return "en";
  return "de";
}

window.addEventListener("DOMContentLoaded", () => {
  let lang = localStorage.getItem("lang");
  if (!lang) {
    lang = detectBrowserLanguage();
    localStorage.setItem("lang", lang);
  }
  i18nInit(lang);
  renderLanguageFlags();
});