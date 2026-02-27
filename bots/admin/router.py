from aiogram import Router

from bots.admin.handlers import start, help
from bots.admin.handlers import companion

def setup_router() -> Router:
    r = Router()
    r.include_router(start.router)
    r.include_router(help.router)
    r.include_router(companion.router)  # ✅ добавили
    return r