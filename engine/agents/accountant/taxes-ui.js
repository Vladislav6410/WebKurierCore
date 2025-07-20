// 📁 engine/agents/accountant/taxes-ui.js

async function submitTaxReturn() {
  const year = document.getElementById('year').value;
  const lohnFile = document.getElementById('lohnFile').files[0];
  const expensesFile = document.getElementById('expensesFile').files[0];
  const resultBox = document.getElementById("result");

  if (!lohnFile) {
    alert("❗ " + (window.i18nText?.uploadLohn || "Bitte wählen Sie eine Datei aus."));
    return;
  }

  const formData = new FormData();
  formData.append("year", year);
  formData.append("lohn", lohnFile);
  if (expensesFile) {
    formData.append("expenses", expensesFile);
  }

  resultBox.innerHTML = `
    ${window.i18nText.success(year)}<br>
    📎 Dateien: ${lohnFile.name}${expensesFile ? " + " + expensesFile.name : ""}<br>
    ${window.i18nText.waiting}
  `;
  resultBox.style.display = "block";

  try {
    const response = await fetch("/api/accountant/submit", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Fehler beim Senden.");

    const result = await response.json();
    resultBox.innerHTML = `
      ✅ ${window.i18nText.success(year)}<br>
      💶 ${window.i18nText.estimatedRefund || "Erstattungsbetrag"}: <b>${result.estimated_refund} €</b><br>
      📁 ${window.i18nText.savedAs || "Gespeichert unter"}: ${result.output_path}
    `;
  } catch (error) {
    resultBox.innerHTML = `❌ Fehler: ${error.message}`;
  }
}