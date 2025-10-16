# ☁️ WebKurierCore — Deploy в Google Cloud Run (EU, 5–10 минут)

Этот гид разворачивает Docker-образ WebKurierCore на **Cloud Run (fully managed)**:
- автоскейл, HTTPS, без VM;
- образ в **Artifact Registry**;
- логин/пароль панели статуса через переменные окружения.

---

## 0) Предпосылки
- У тебя есть проект GCP (Project ID).
- gcloud установлен локально (если хочешь ручной деплой).
- Репозиторий GitHub с Dockerfile и `engine/startup_loader.py`.

---

## 1) Что уже есть в репозитории