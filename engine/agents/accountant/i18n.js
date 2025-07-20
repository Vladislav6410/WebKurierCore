// 📁 engine/agents/accountant/i18n.js

const translations = {
  de: {
    title: "💶 Steuer-Assistent",
    selectYear: "Jahr wählen:",
    uploadLohn: "Lohnsteuerbescheinigung:",
    uploadExpenses: "Zusätzliche Ausgaben:",
    generate: "📤 Erklärung erstellen",
    success: (year) => `✅ Steuererklärung für <b>${year}</b> vorbereitet.`,
    waiting: "⏳ Bitte warten Sie auf die Analyse...",
    estimatedRefund: "Erstattungsbetrag",
    savedAs: "Gespeichert unter"
  },
  ru: {
    title: "💶 Налоговый помощник",
    selectYear: "Выберите год:",
    uploadLohn: "Файл Lohnsteuerbescheinigung:",
    uploadExpenses: "Дополнительные расходы:",
    generate: "📤 Сформировать декларацию",
    success: (year) => `✅ Декларация за <b>${year}</b> подготовлена.`,
    waiting: "⏳ Пожалуйста, подождите...",
    estimatedRefund: "Сумма возврата",
    savedAs: "Сохранено как"
  },
  en: {
    title: "💶 Tax Assistant",
    selectYear: "Select year:",
    uploadLohn: "Lohnsteuer certificate:",
    uploadExpenses: "Additional expenses:",
    generate: "📤 Generate Declaration",
    success: (year) => `✅ Tax declaration for <b>${year}</b> is ready.`,
    waiting: "⏳ Please wait for analysis...",
    estimatedRefund: "Estimated refund",
    savedAs: "Saved as"
  },
  pl: {
    title: "💶 Asystent podatkowy",
    selectYear: "Wybierz rok:",
    uploadLohn: "Lohnsteuerbescheinigung (dochód):",
    uploadExpenses: "Dodatkowe wydatki:",
    generate: "📤 Utwórz deklarację",
    success: (year) => `✅ Deklaracja podatkowa za <b>${year}</b> gotowa.`,
    waiting: "⏳ Proszę czekać na analizę...",
    estimatedRefund: "Zwrot podatku",
    savedAs: "Zapisano jako"
  }
};

function i18nInit(lang = "de") {
  const t = translations[lang] || translations["de"];
  document.querySelector("h1").innerText = t.title;
  document.querySelector("label[for='year']").innerText = t.selectYear;
  document.querySelector("label[for='lohnFile']").innerText = t.uploadLohn;
  document.querySelector("label[for='expensesFile']").innerText = t.uploadExpenses;
  document.querySelector("button").innerText = t.generate;

  // Подключим в JS при отправке:
  window.i18nText = t;
}