#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, yaml, subprocess, time, threading
from typing import Dict

# ======= Конфиг =======
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG_PATH = os.path.join(BASE, 'config', 'config.yaml')
PORT = int(os.getenv('PORT', '8080'))  # порт для FastAPI

# ======= Статус агентов =======
# agents[name] = {"path": str, "entry": str, "pid": int|None}
agents: Dict[str, Dict] = {}

# ======= FastAPI сервер (/status, /healthz) =======
def start_api_server():
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    import uvicorn

    app = FastAPI(title="WebKurierCore Status", version="1.0")

    @app.get("/healthz")
    def health():
        return {"ok": True}

    @app.get("/status")
    def status():
        data = []
        for name, meta in agents.items():
            pid = meta.get("pid")
            running = False
            if pid:
                try:
                    # Процесс считается живым, если не вернул код завершения
                    running = (subprocess.Popen.poll(meta["proc"]) is None)
                except Exception:
                    running = False
            data.append({
                "name": name,
                "path": meta.get("path"),
                "entry": meta.get("entry"),
                "pid": pid,
                "running": running,
            })
        return JSONResponse(content={"port": PORT, "agents": data})

    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")

# ======= Загрузка конфига =======
def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

# ======= Запуск агента =======
def start_agent(key, module):
    path = module.get('path', '/')
    agent_dir = os.path.normpath(os.path.join(BASE, path.strip('/')))
    entry_file = os.path.join(agent_dir, f'{key}-agent.py')

    meta = {"path": agent_dir, "entry": entry_file, "pid": None, "proc": None}
    agents[key] = meta

    if os.path.isfile(entry_file):
        print(f'🚀 Запускаю: {key} → {entry_file}', flush=True)
        proc = subprocess.Popen(['python3', entry_file], cwd=agent_dir)
        meta["proc"] = proc
        meta["pid"] = proc.pid
    else:
        print(f'⚠️ Не найден файл запуска: {entry_file}', flush=True)

def main():
    print('🧠 WebKurierCore Autostart + Status API', flush=True)

    # 1) поднимаем API в отдельном потоке
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    print(f'🌐 Status API запущен на порту {PORT} (/status, /healthz)', flush=True)

    # 2) читаем конфиг и запускаем активные модули
    try:
        cfg = load_config()
    except Exception as e:
        print(f'❌ Ошибка загрузки конфига {CONFIG_PATH}: {e}', flush=True)
        sys.exit(1)

    modules = cfg.get('modules', {})
    print(f'🔧 Модулей в конфиге: {len(modules)}', flush=True)

    for key, mod in modules.items():
        if mod.get("enabled"):
            start_agent(key, mod)
            time.sleep(0.8)

    print('✅ Инициализация завершена. Открывай /status', flush=True)

    # 3) держим главный процесс живым
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("⏹ Остановка...", flush=True)

if __name__ == '__main__':
    main()