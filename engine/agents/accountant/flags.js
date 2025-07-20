function getLangFromURL() {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");
  if (["de", "ru", "en", "pl"].includes(lang)) {
    return lang;
  }
  return null;
}

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
      setLanguage(code);
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

function setLanguage(lang) {
  i18nInit(lang);
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);
}

window.addEventListener("DOMContentLoaded", () => {
  let lang = getLangFromURL() || localStorage.getItem("lang") || detectBrowserLanguage();
  setLanguage(lang);
  renderLanguageFlags();
});