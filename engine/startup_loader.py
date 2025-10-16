#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, yaml, subprocess, time, threading
from typing import Dict
from hmac import compare_digest

# ======= Конфиг =======
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG_PATH = os.path.join(BASE, 'config', 'config.yaml')
PORT = int(os.getenv('PORT', '8080'))  # порт для FastAPI

# Basic-Auth (логин/пароль из окружения)
STATUS_USER = os.getenv('STATUS_USER', '')
STATUS_PASS = os.getenv('STATUS_PASS', '')

# ======= Статус агентов =======
# agents[name] = {"path": str, "entry": str, "pid": int|None, "proc": Popen|None}
agents: Dict[str, Dict] = {}

# ======= FastAPI сервер (/, /status, /healthz) =======
def start_api_server():
    from fastapi import FastAPI, Depends, HTTPException, status
    from fastapi.responses import JSONResponse, HTMLResponse
    from fastapi.security import HTTPBasic, HTTPBasicCredentials
    import uvicorn

    app = FastAPI(title="WebKurierCore Status", version="1.0")
    security = HTTPBasic(realm="WebKurierCore Status")

    def require_auth(creds: HTTPBasicCredentials = Depends(security)):
        # Если переменные не заданы — не даём доступ
        if not STATUS_USER or not STATUS_PASS:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Auth disabled: set STATUS_USER/STATUS_PASS")
        ok_user = compare_digest(creds.username, STATUS_USER)
        ok_pass = compare_digest(creds.password, STATUS_PASS)
        if not (ok_user and ok_pass):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized",
                headers={"WWW-Authenticate": 'Basic realm="WebKurierCore Status"'},
            )
        return True

    @app.get("/healthz")
    def health():
        return {"ok": True}

    @app.get("/status")
    def status_json(_: bool = Depends(require_auth)):
        data = []
        for name, meta in agents.items():
            pid = meta.get("pid")
            running = False
            if pid and meta.get("proc"):
                try:
                    running = (meta["proc"].poll() is None)
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

    @app.get("/", response_class=HTMLResponse)
    def dashboard(_: bool = Depends(require_auth)):
        html = f"""<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>WebKurierCore · Status</title>
<style>
  :root {{ color-scheme: dark; }}
  body {{ margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b0c10; color:#e6e6e6; }}
  header {{ background:#151821; border-bottom:1px solid #2a3140; padding:12px 16px; }}
  main {{ padding:16px; max-width: 980px; margin: 0 auto; }}
  h1 {{ margin:0; font-size:18px; }}
  .meta {{ opacity:.75; font-size:14px; margin-top:4px; }}
  table {{ width:100%; border-collapse: collapse; margin-top:16px; }}
  th, td {{ border-bottom:1px solid #2a3140; padding:10px 8px; text-align:left; font-size:14px; }}
  th {{ background:#12151d; position:sticky; top:0; }}
  .chip {{ display:inline-block; padding:3px 8px; border-radius:999px; font-size:12px; }}
  .ok {{ background:#123d2a; color:#7dffa8; border:1px solid #1f5e3e; }}
  .bad {{ background:#3d121b; color:#ff7d9a; border:1px solid #5e1f2e; }}
  .muted {{ opacity:.65; }}
  footer {{ opacity:.7; font-size:12px; margin-top:14px; }}
</style>
</head>
<body>
  <header>
    <h1>🧠 WebKurierCore — Status</h1>
    <div class="meta">API: <code>http://localhost:{PORT}</code> • обновление каждые <b>2s</b></div>
  </header>
  <main>
    <div id="summary" class="muted">Загружаю...</div>
    <table id="tbl">
      <thead><tr><th>Агент</th><th>Entry</th><th>PID</th><th>Статус</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
    <footer>Источник — <code>/status</code>. Health — <code>/healthz</code>.</footer>
  </main>
<script>
async function load() {{
  try {{
    const r = await fetch('/status', {{ cache: 'no-store' }});
    const j = await r.json();
    const rows = document.getElementById('rows');
    rows.innerHTML = '';
    const agents = j.agents || [];
    let running = 0;
    for (const a of agents) {{
      if (a.running) running++;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${{a.name}}</b><div class="muted">${{a.path||''}}</div></td>
        <td><code>${{a.entry||''}}</code></td>
        <td>${{a.pid || '—'}}</td>
        <td>${{a.running ? '<span class="chip ok">running</span>' : '<span class="chip bad">stopped</span>'}}</td>`;
      rows.appendChild(tr);
    }}
    document.getElementById('summary').innerHTML =
      `Агентов: <b>${{agents.length}}</b> • Running: <b>${{running}}</b> • Port: <code>${{j.port}}</code>`;
  }} catch(e) {{
    document.getElementById('summary').innerHTML = 'Ошибка загрузки /status';
  }}
}}
load(); setInterval(load, 2000);
</script>
</body></html>"""
        return HTMLResponse(content=html)

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
    print('🧠 WebKurierCore Autostart + Status API (Basic-Auth)', flush=True)

    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    print(f'🌐 Status API: / (auth), /status (auth), /healthz (public) · PORT={PORT}', flush=True)

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

    print('✅ Инициализация завершена. Открой панель в браузере', flush=True)

    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("⏹ Остановка...", flush=True)

if __name__ == '__main__':
    main()