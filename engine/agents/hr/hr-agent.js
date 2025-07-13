// engine/agents/hr/hr-agent.js

export const HRAgent = {
  analyzeResume: () => {
    const sample = `
📄 Резюме получено:
• Имя: Иван Программист
• Опыт: 4 года
• Навыки: JavaScript, Python, Git

✅ Заключение: Подходит на роль "Программист". Уровень: Middle.
🧠 Рекомендация: Добавить знание TypeScript.
    `.trim();

    HRAgent._output(sample);
  },

  generateVacancy: () => {
    const vacancy = `
📌 Вакансия:
• Должность: Frontend-разработчик
• Требования: HTML, CSS, JavaScript, React
• Уровень: Junior/Middle
• Удалённо: Да

🧲 Ищем талантливого разработчика в команду WebKurier!
    `.trim();

    HRAgent._output(vacancy);
  },

  rateCandidate: () => {
    const rating = `
🧪 Оценка кандидата:
• Hard Skills: 8/10
• Soft Skills: 6/10
• Профпригодность: 78%
⚠️ Рекомендовано: дообучение по теме "Асинхронный JS"
    `.trim();

    HRAgent._output(rating);
  },

  _output: (text) => {
    const out = document.getElementById("output");
    if (out) {
      out.innerText = text;
    } else {
      console.warn("❗ Элемент #output не найден.");
    }
  }
};