# Translator Provider Switch — Checklist & Validator

Этот файл описывает:
1. Как зафиксировать конфиг переводчика (showOriginal + provider).
2. Как проверить и отвалидировать переключение провайдера через `/config provider ...`.
3. Мини-рутину для ручного и автоматизированного тестирования.

---

## 1. Быстрый чек-лист фиксации конфига

### 1.1. Структура файлов

Убедиться, что в репозитории присутствуют:

- `engine/agents/translator/translator-config.js`
- `engine/agents/translator/ui/terminal-bridge.js`
- `engine/agents/translator/translator-agent.js`
- `engine/agents/translator/tests/translator-abang-ux.test.json`
- `engine/agents/translator/tests/translator-abang-ux-runner.js`
- `engine/agents/translator/tests/index.test.html`

### 1.2. Конфиг переводчика

Проверить, что `translator-config.js` содержит:

- Массив допустимых провайдеров:
  ```js
  const ALLOWED_PROVIDERS = ["auto", "libre", "gpt", "local"];