from aiogram import Router

from .handlers import start, help, agents

router = Router()

router.include_router(start.router)
router.include_router(help.router)
router.include_router(agents.router)