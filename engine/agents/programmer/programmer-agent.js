// engine/agents/programmer/programmer-agent.js

export const ProgrammerAgent = {
  generateCode: () => {
    const code = `
<!-- Пример сгенерированного HTML-кода -->
<div class="card">
  <h2>Заголовок</h2>
  <p>Описание блока, сгенерированного агентом.</p>
</div>
    `.trim();

    ProgrammerAgent._output(code);
  },

  fixBugs: () => {
    const message = "🛠 Проверка завершена: ошибок не обнаружено (симуляция)";
    ProgrammerAgent._output(message);
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) {
      out.innerText = text;
    } else {
      console.warn("Элемент #output не найден.");
    }
  }
};