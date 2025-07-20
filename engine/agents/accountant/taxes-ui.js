// 📁 engine/agents/accountant/taxes-ui.js

async function submitTaxReturn() {
  const year = document.getElementById('year').value;
  const lohnFile = document.getElementById('lohnFile').files[0];
  const expensesFile = document.getElementById('expensesFile').files[0];
  const resultBox = document.getElementById("result");

  if (!lohnFile) {
    alert("❗ Пожалуйста, выберите Lohnsteuerbescheinigung файл.");
    return;
  }

  const formData = new FormData();
  formData.append("year", year);
  formData.append("lohn", lohnFile);
  if (expensesFile) {
    formData.append("expenses", expensesFile);
  }

  resultBox.innerHTML = "⏳ Отправка данных на сервер...";
  resultBox.style.display = "block";

  try {
    const response = await fetch("/api/accountant/submit", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Ошибка при отправке");

    const result = await response.json();
    resultBox.innerHTML = `
      ✅ Декларация за <b>${year}</b> сформирована!<br>
      💶 Возврат: <b>${result.estimated_refund} €</b><br>
      📁 Сохранено: ${result.output_path}
    `;
  } catch (error) {
    resultBox.innerHTML = `❌ Ошибка: ${error.message}`;
  }
}