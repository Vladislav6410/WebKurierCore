from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="WebKurierCore API")

@app.get("/api/health", tags=["health"])
async def health_check():
    # Здесь позже можно добавить реальные проверки:
    # - связь с Terrain-LLM
    # - связь с DroneHybrid / Chain / Security
    # - состояние очередей, БД и т.п.
    return JSONResponse(
        content={
            "status": "ok",
            "service": "WebKurierCore",
            "terrain_llm": "unknown",  # потом: "ok" / "degraded" / "down"
        }
    )