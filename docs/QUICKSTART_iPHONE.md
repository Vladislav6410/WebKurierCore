# WebKurierCore — QUICKSTART (iPhone / Mobile) ✅

Этот файл — инструкция “как букварь”, чтобы работать с WebKurierCore с iPhone:
- где Codex
- где задачи
- как запускать проект
- как принимать изменения (PR → Merge)
- что делать при ошибках

---

## 1) Где открыть Codex (страница задач)

✅ Ссылка на Codex:
https://chatgpt.com/codex

Если потерял страницу задач:
1) Открой ссылку выше
2) Вверху выбери репозиторий **Vladislav6410/WebKurierCore**
3) Пролистай вниз до блока **Задачи**
4) Там будут все созданные задачи и результаты

---

## 2) Как создать первую задачу (идеальная первая задача)

В поле ввода Codex вставляй так:

/plan
Goal: Boot WebKurierCore in Codex environment and verify core API.
Tasks:
1) Detect project stack and entrypoints (Node + FastAPI).
2) Add one dev command to start all services together.
3) Verify /health, /api/codex/run, and FastAPI heartbeat route.
4) Document steps in README for iPhone-friendly usage.

Потом нажми кнопку отправки (стрелка вверх).

---

## 3) Где смотреть результат задачи

Когда Codex закончит:
1) В блоке “Задачи” появится выполненная задача
2) Открой её
3) Там есть вкладки:
   - **Обсуждение**
   - **Разница** (что поменялось в коде)
   - **Журналы** (что Codex запускал)

✅ Если ты хочешь просто увидеть изменения:
→ открывай вкладку **Разница**

---

## 4) Как принять изменения (Merge PR)

Если Codex сделал изменения, чаще всего он создает Pull Request.

Порядок действий:
1) Открой задачу → вкладка PR (или открой PR в GitHub)
2) Нажми зеленую кнопку **Merge Pull Request**
3) Подтверди merge
4) После merge появится кнопка **Delete branch**
   - нажимай ✅ (это безопасно после merge)

---

## 5) Если после merge вылезла ошибка (красный блок)

Иногда GitHub мобильный показывает ошибку вида:
"Could not resolve to a node with global id..."

✅ Что делать:
1) Просто обнови страницу (pull-to-refresh)
2) Или закрой PR и открой заново через GitHub:
   - вкладка Pull Requests → открой тот же PR
3) Проверка успешности merge:
   - в PR должно быть написано **Merged**
   - коммит появился в ветке **main**

Если написано "Branch merged" — значит всё ОК ✅

---

## 6) Как запустить WebKurierCore локально (Linux/Server)

Это короткий запуск для сервера:

### 6.1 Node (Express)
В корне проекта:
npm install
npm run dev

Ожидается:
- Server running: http://localhost:3000
- Health: http://localhost:3000/health

### 6.2 FastAPI (Python)
В корне проекта:
pip install -r requirements.txt
bash backend/start_uvicorn.sh

Ожидается:
- FastAPI: http://localhost:8081

---

## 7) Проверка ключевых endpoints

Открой в браузере:

### Node
http://<домен>:3000/health

### Codex API (Node route)
POST:
http://<домен>:3000/api/codex/run

### FastAPI telemetry (пример)
POST:
http://<домен>:8081/heartbeat

---

## 8) Что “правильно” добавлять второй задачей (после запуска)

Идеальная задача №2:

/plan
Goal: Add a safe "Core Status Dashboard" endpoint and minimal UI.
Tasks:
1) Add GET /api/status returning services health (node + fastapi).
2) Add a simple status page in frontend/status/index.html.
3) Document status usage in docs/QUICKSTART_iPHONE.md.

---

## 9) Где хранить документацию

Все инструкции только сюда:
WebKurierCore/docs/

Обязательные файлы:
- docs/ARCHITECTURE_CORE.md
- docs/QUICKSTART_iPHONE.md

---

## 10) Главное правило Core

Пользователь → WebKurierCore → доменные ядра

Core НЕ должен напрямую хранить секреты и токены.
Все секреты только через:
- .env (gitignored)
- GitHub Secrets
- переменные окружения Docker/CI

---