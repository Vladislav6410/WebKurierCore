#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

from router import router  # твой router.py
from security import validate_admin_config  # если есть проверка allowlist

# -------------------------------------------------
# ENV
# -------------------------------------------------
BOT_TOKEN = os.getenv("TELEGRAM_ADMIN_BOT_TOKEN", "").strip()

if not BOT_TOKEN:
    raise RuntimeError("❌ TELEGRAM_ADMIN_BOT_TOKEN not set")

# -------------------------------------------------
# Logging
# -------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

log = logging.getLogger("webkurier-admin-bot")

# -------------------------------------------------
# Main
# -------------------------------------------------
async def main():
    log.info("🚀 Starting WebKurier Admin Bot...")

    # если есть строгая проверка ADMIN_IDS
    validate_admin_config()

    bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.MARKDOWN)
    dp = Dispatcher()

    dp.include_router(router)

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())