// engine/i18n/i18n.js
// Unified i18n module — WebKurierCore
// Provides: loadLocale(), setLocale(), i18n(textKey), i18nInit()

const i18n = {
    current: "en",
    data: {},

    async loadLocale(lang) {
        try {
            const response = await fetch(`./i18n/${lang}.json`);
            this.data = await response.json();
            this.current = lang;
            console.log(`[i18n] Loaded locale: ${lang}`);
        } catch (err) {
            console.error("[i18n] Locale load error:", err);
        }
    },

    async setLocale(lang) {
        await this.loadLocale(lang);
        this.apply();
    },

    t(key) {
        return this.data[key] || key;
    },

    apply() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.innerText = this.t(key);
        });
    }
};

// 🟢 REQUIRED BY CI — declare globally
// so linter does NOT trigger "no-undef"
window.i18n = i18n;

// 🟢 REQUIRED INIT FUNCTION
async function i18nInit() {
    const saved = localStorage.getItem("lang") || "en";
    await i18n.setLocale(saved);
    console.log("[i18n] Initialized");
}

window.i18nInit = i18nInit;