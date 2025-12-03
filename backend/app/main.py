from fastapi import FastAPI, APIRouter, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timezone
import subprocess
import httpx
import asyncio

# Глобальное состояние heartbeat’ов телеметрии
TELEMETRY_STATE = {
    "status": "unknown",
    "last_heartbeat": None,
    "details": {},
}

app = FastAPI(title="WebKurierCore API")

# --- 1. Проверка systemd-статуса ---
def get_systemd_status(service_name: str) -> str:
    try:
        out = subprocess.check_output(
            ["systemctl", "is-active", service_name],
            text=True,
        ).strip()
        if out in ("active", "inactive", "failed"):
            return out
        return "unknown"
    except Exception:
        return "unknown"

# --- 2. HTTP-probe телеметрии ---
async def probe_telemetry_http(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("status", "healthy")
        return f"http_{resp.status_code}"
    except Exception:
        return "unreachable"

# --- 3. /api/health ---
@app.get("/api/health", tags=["health"])
async def core_health():
    core_status = "ok"
    telemetry_systemd = get_systemd_status("webkurier-telemetry")
    telemetry_http = await probe_telemetry_http("http://127.0.0.1:9090/health")

    # Статус из push-heartbeat
    telemetry_heartbeat = {
        "status": TELEMETRY_STATE["status"],
        "last_heartbeat": TELEMETRY_STATE["last_heartbeat"],
        "details": TELEMETRY_STATE["details"],
    }

    overall = "ok"
    if telemetry_systemd != "active" or telemetry_http != "healthy":
        overall = "degraded"
    if telemetry_systemd in ("failed", "unknown") or telemetry_http == "unreachable":
        overall = "problem"

    return JSONResponse({
        "status": overall,
        "service": "WebKurierCore",
        "core": {"status": core_status},
        "telemetry": {
            "systemd": telemetry_systemd,
            "http": telemetry_http,
            "heartbeat": telemetry_heartbeat,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

# --- 4. endpoint для приёма heartbeat’ов ---
router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

class Heartbeat(BaseModel):
    service: str = "webkurier-telemetry"
    status: str = "ok"
    details: dict | None = None

@router.post("/heartbeat")
async def telemetry_heartbeat(payload: Heartbeat = Body(...)):
    TELEMETRY_STATE["status"] = payload.status
    TELEMETRY_STATE["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
    TELEMETRY_STATE["details"] = payload.details or {}
    return {"ok": True, "stored_at": TELEMETRY_STATE["last_heartbeat"]}

app.include_router(router)

# --- 5. Фоновый опрос телеметрии Core’ом (pull-model мониторинг) ---
async def telemetry_pull_loop():
    while True:
        try:
            s = get_systemd_status("webkurier-telemetry")
            h = await probe_telemetry_http("http://127.0.0.1:9090/health")
            TELEMETRY_STATE["systemd_probed"] = s
            TELEMETRY_STATE["http_probed"] = h
        except:
            pass
        await asyncio.sleep(10)

@app.on_event("startup")
async def on_start():
    asyncio.create_task(telemetry_pull_loop())

if __name__ == "__main__":
    asyncio.run(app.run())