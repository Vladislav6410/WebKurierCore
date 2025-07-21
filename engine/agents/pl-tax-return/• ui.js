// engine/agents/accountant/ui.js

let inputData = {
  lohn: null,
  expenses: null,
  contracts: null,
};

function handleFileInput(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      if (type === "lohn") {
        inputData.lohn = e.target.result;
      } else {
        inputData[type] = JSON.parse(e.target.result);
      }
    } catch (err) {
      alert("Ошибка при чтении файла: " + err.message);
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("scanInput").addEventListener("change", (e) => handleFileInput(e, "lohn"));
  document.getElementById("expensesInput").addEventListener("change", (e) => handleFileInput(e, "expenses"));
  document.getElementById("contractsInput").addEventListener("change", (e) => handleFileInput(e, "contracts"));

  document.getElementById("generateBtn").addEventListener("click", () => {
    const output = {
      created: new Date().toISOString(),
      lohn_raw: inputData.lohn || "не загружен",
      expenses: inputData.expenses || [],
      contracts: inputData.contracts || [],
    };
    document.getElementById("output").innerText = JSON.stringify(output, null, 2);
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const json = document.getElementById("output").innerText;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "declaration.json";
    a.click();
  });
});