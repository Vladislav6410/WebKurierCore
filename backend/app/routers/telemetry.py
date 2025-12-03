from fastapi import APIRouter, Body
from pydantic import BaseModel
from datetime import datetime, timezone

# Импортируем глобальное состояние из main.py
from app.main import TELEMETRY_STATE  # аккуратно: здесь простая общая переменная

router = APIRouter(
    prefix="/api/telemetry",
    tags=["telemetry"],
)


class TelemetryHeartbeat(BaseModel):
    service: str = "webkurier-telemetry"
    status: str = "ok"
    details: dict | None = None


@router.post("/heartbeat")
async def telemetry_heartbeat(payload: TelemetryHeartbeat = Body(...)):
    TELEMETRY_STATE["status"] = payload.status
    TELEMETRY_STATE["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
    TELEMETRY_STATE["details"] = payload.details or {}

    return {
        "ok": True,
        "service": payload.service,
        "stored_status": TELEMETRY_STATE["status"],
        "stored_at": TELEMETRY_STATE["last_heartbeat"],
    }