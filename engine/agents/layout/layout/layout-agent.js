// engine/agents/layout/layout-agent.js

export const LayoutAgent = {
  buildFromTemplate: () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>🌐 Новый макет</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          header, footer { background: #eee; padding: 10px; text-align: center; }
          main { margin: 20px 0; }
        </style>
      </head>
      <body>
        <header>🔝 Шапка сайта</header>
        <main>📄 Основной контент</main>
        <footer>📫 Подвал сайта</footer>
      </body>
      </html>
    `.trim();
    LayoutAgent._output(html);
  },

  analyzeLayout: () => {
    const analysis = `
      🔍 Анализ макета:
      • Использован базовый HTML-шаблон
      • Присутствуют теги: header, main, footer
      • Стили заданы в <style>
      • Макет подходит для адаптивной доработки
    `.trim();
    LayoutAgent._output(analysis);
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) out.innerText = text;
    console.log(text);
  }
};