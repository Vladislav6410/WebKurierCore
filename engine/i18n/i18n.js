// === i18n/i18n.js ===

const translations = {
  ru: {
    title: "🌐 WebKurierCore",
    subtitle: "Добро пожаловать в автономный интерфейс WebKurier: терминал, кошелёк, Telegram-связь.",
    wallet: "💰 WebCoin-кошелёк",
    balance: "Баланс",
    add: "+10 WKC",
    reset: "Сброс",
    terminal: "⏎ Пуск",
    files: "📁 Файлы",
    tools: "🛠 Инструменты",
    copy: "📋 Копировать",
    telegram: "🔗 Telegram",
    say: "Скажи или напиши…"
  },
  en: {
    title: "🌐 WebKurierCore",
    subtitle: "Welcome to the WebKurier autonomous interface: terminal, wallet, Telegram connection.",
    wallet: "💰 WebCoin Wallet",
    balance: "Balance",
    add: "+10 WKC",
    reset: "Reset",
    terminal: "⏎ Run",
    files: "📁 Files",
    tools: "🛠 Tools",
    copy: "📋 Copy",
    telegram: "🔗 Telegram",
    say: "Speak or type…"
  },
  de: {
    title: "🌐 WebKurierCore",
    subtitle: "Willkommen im autonomen WebKurier-Interface: Terminal, Wallet, Telegram-Verbindung.",
    wallet: "💰 WebCoin-Brieftasche",
    balance: "Kontostand",
    add: "+10 WKC",
    reset: "Zurücksetzen",
    terminal: "⏎ Start",
    files: "📁 Dateien",
    tools: "🛠 Werkzeuge",
    copy: "📋 Kopieren",
    telegram: "🔗 Telegram",
    say: "Sprich oder schreibe…"
  },
  pl: {
    title: "🌐 WebKurierCore",
    subtitle: "Witamy w autonomicznym interfejsie WebKurier: terminal, portfel, połączenie z Telegramem.",
    wallet: "💰 Portfel WebCoin",
    balance: "Saldo",
    add: "+10 WKC",
    reset: "Resetuj",
    terminal: "⏎ Start",
    files: "📁 Pliki",
    tools: "🛠 Narzędzia",
    copy: "📋 Kopiuj",
    telegram: "🔗 Telegram",
    say: "Powiedz lub napisz…"
  }
};

// Текущий язык
let currentLang = "ru";

export function setLang(langCode) {
  if (translations[langCode]) {
    currentLang = langCode;
    localStorage.setItem("lang", langCode);
    applyTranslations();
  }
}

export function getLang() {
  return currentLang;
}

export function translate(key) {
  return translations[currentLang][key] || key;
}

export function applyTranslations() {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = translate(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = value;
    } else {
      el.innerHTML = value;
    }
  });
}

// Автоопределение языка
(function initLang() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  const storedLang = localStorage.getItem("lang");
  const browserLang = navigator.language.slice(0, 2);

  const chosenLang =
    urlLang || storedLang || (translations[browserLang] ? browserLang : "ru");

  setLang(chosenLang);
})();