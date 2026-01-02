# WebKurier Workflows (Relay-like Engine)

Минимальный workflow runtime для WebKurierCore:
- Triggers: webhook / schedule / manual
- Steps: http.request / ai.prompt / data.transform / human.approval
- Runner: выполняет граф (DAG), хранит контекст, пишет события

Security boundary:
- Любые внешние URL/входные payload должны валидироваться WebKurierSecurity.
- Аудит событий runs/steps желательно писать в WebKurierChain (append-only).

Структура:
- workflow.schema.json — схема workflow
- registry.js — реестр trigger/step плагинов
- store.js — хранилище runs (in-memory, потом заменим на DB)
- runner.js — движок выполнения workflow
- triggers/* — реализации триггеров
- steps/* — реализации шагов
- examples/* — примеры workflow