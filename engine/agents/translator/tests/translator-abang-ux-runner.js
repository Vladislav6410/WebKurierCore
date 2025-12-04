// engine/agents/translator/tests/translator-abang-ux-runner.js

import { isTranslatorCommand, handleTranslatorCommand } from "../ui/terminal-bridge.js";

async function loadTests() {
  // Браузер
  if (typeof window !== "undefined" && typeof fetch === "function") {
    const resp = await fetch("./translator-abang-ux.test.json");
    if (!resp.ok) {
      throw new Error("Не удалось загрузить translator-abang-ux.test.json");
    }
    return resp.json();
  }

  // Node.js (ESM)
  const fs = await import("fs");
  const url = new URL("./translator-abang-ux.test.json", import.meta.url);
  const raw = fs.readFileSync(url, "utf8");
  return JSON.parse(raw);
}

async function runTranslatorAbangTests() {
  const tests = await loadTests();
  const results = [];

  for (const t of tests) {
    const { id, command, expectedLang } = t;
    const entry = { id, command, expectedLang, ok: true, error: null };

    try {
      if (!isTranslatorCommand(command)) {
        entry.ok = false;
        entry.error = "isTranslatorCommand вернул false";
      } else {
        const res = await handleTranslatorCommand(command, {
          userId: "test-user"
        });

        if (!res) {
          entry.ok = false;
          entry.error = "handleTranslatorCommand вернул null/undefined";
        } else if (res.langCode !== expectedLang) {
          entry.ok = false;
          entry.error = `Ожидался langCode="${expectedLang}", получен "${res.langCode}"`;
        } else if (!res.translated && expectedLang !== "cfg" && expectedLang !== "info") {
          // для cfg/info перевод может быть служебным, но он всё равно должен быть строкой
          entry.ok = false;
          entry.error = "Пустой translated";
        } else {
          entry.provider = res.provider || "none";
        }
      }
    } catch (e) {
      entry.ok = false;
      entry.error = String(e);
    }

    results.push(entry);
  }

  // Вывод в консоль
  const okCount = results.filter(r => r.ok).length;
  const failCount = results.length - okCount;

  console.group("Translator Abang UX tests");
  for (const r of results) {
    if (r.ok) {
      console.log(
        `✅ [${r.id}] ${r.command} → lang=${r.expectedLang}` +
        (r.provider ? `, provider=${r.provider}` : "")
      );
    } else {
      console.warn(`❌ [${r.id}] ${r.command} → ${r.error}`);
    }
  }
  console.log(`Итого: ${okCount} ok, ${failCount} fail, всего ${results.length}`);
  console.groupEnd();

  // Доп. вывод в браузере
  if (typeof document !== "undefined") {
    const pre = document.createElement("pre");
    pre.style.fontFamily = "monospace";
    pre.textContent =
      "Translator Abang UX tests\n" +
      results
        .map(r =>
          `${r.ok ? "✅" : "❌"} [${r.id}] ${r.command} → ${
            r.ok ? `lang=${r.expectedLang}${r.provider ? ", provider=" + r.provider : ""}` : r.error
          }`
        )
        .join("\n");
    document.body.appendChild(pre);
  }

  return results;
}

// Автозапуск:
// - в браузере при загрузке <script type="module"> ... </script>
// - в Node, если файл запущен напрямую: node translator-abang-ux-runner.js
if (typeof window !== "undefined") {
  // браузер
  runTranslatorAbangTests().catch((e) =>
    console.error("Ошибка при выполнении тестов:", e)
  );
} else {
  // Node.js: проверяем, что файл исполняется напрямую
  const isMain = import.meta.url === `file://${process.argv[1]}`;
  if (isMain) {
    runTranslatorAbangTests().catch((e) =>
      console.error("Ошибка при выполнении тестов:", e)
    );
  }
}

// Также экспорт, чтобы можно было вызвать вручную из других модулей
export { runTranslatorAbangTests };