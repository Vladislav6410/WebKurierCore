#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WebKurier Admin Bot (Telegram) — управляющая консоль для WebKurierCore.

✅ Правила безопасности:
- Токен НЕ хранить в репозитории (только ENV: TELEGRAM_ADMIN_BOT_TOKEN)
- Доступ только по allowlist (ENV: ADMIN_IDS="123,456")
- Админ-команды работают только в личке (по твоим Scope настройкам в Telegram)

Архитектурно:
AdminBot -> WebKurierCore API (CORE_ADMIN_API_URL) -> агенты/модули
"""

import os
import json
import logging
from typing import Any, Dict, Optional, List

import aiohttp
from aiogram import Bot, Dispatcher, Router, F
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import Message

# ---------------------------
# ENV / CONFIG
# ---------------------------
BOT_TOKEN = os.getenv("TELEGRAM_ADMIN_BOT_TOKEN", "").strip()
CORE_ADMIN_API_URL = os.getenv("CORE_ADMIN_API_URL", "http://127.0.0.1:8080/admin").rstrip("/")
ADMIN_IDS_RAW = os.getenv("ADMIN_IDS", "").strip()  # example: "123456789,987654321"
REQUEST_TIMEOUT_SEC = float(os.getenv("CORE_API_TIMEOUT", "8"))

if not BOT_TOKEN:
    raise RuntimeError("Missing ENV TELEGRAM_ADMIN_BOT_TOKEN")

def _parse_admin_ids(raw: str) -> List[int]:
    ids: List[int] = []
    if not raw:
        return ids
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            pass
    return ids

ADMIN_IDS = set(_parse_admin_ids(ADMIN_IDS_RAW))

# Если список пуст — это опасно. Лучше явно задать.
if not ADMIN_IDS:
    logging.warning("ADMIN_IDS is empty. Set ENV ADMIN_IDS to restrict access (recommended).")

# ---------------------------
# Logging
# ---------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("webkurier-admin-bot")

# ---------------------------
# Helpers: auth + API calls
# ---------------------------
def is_admin(user_id: Optional[int]) -> bool:
    if user_id is None:
        return False
    # Если ADMIN_IDS пуст — можно либо запретить всем, либо разрешить.
    # Я делаю безопаснее: если список пуст — запретить всем.
    return user_id in ADMIN_IDS

async def core_api_call(
    session: aiohttp.ClientSession,
    method: str,
    path: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Унифицированный вызов Core Admin API.
    Ожидаемый формат ответа:
      { "ok": true, "data": {...} }
      { "ok": false, "error": "..." }
    """
    url = f"{CORE_ADMIN_API_URL}{path}"
    try:
        async with session.request(
            method=method,
            url=url,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SEC),
        ) as resp:
            text = await resp.text()
            if resp.headers.get("Content-Type", "").startswith("application/json"):
                data = await resp.json()
            else:
                # если API вернул текст/HTML — оборачиваем
                data = {"ok": False, "error": f"Non-JSON response ({resp.status}): {text[:400]}"}

            # нормализуем при отсутствии ok
            if "ok" not in data:
                data = {"ok": resp.status < 400, "data": data, "status": resp.status}

            return data
    except aiohttp.ClientError as e:
        return {"ok": False, "error": f"Core API connection error: {e}"}
    except Exception as e:
        return {"ok": False, "error": f"Core API unexpected error: {e}"}

def fmt_kv(title: str, kv: Dict[str, Any]) -> str:
    lines = [f"**{title}**"]
    for k, v in kv.items():
        lines.append(f"• `{k}`: `{v}`")
    return "\n".join(lines)

# ---------------------------
# Bot / Router
# ---------------------------
router = Router()

ADMIN_START_TEXT = (
    "🛠 *WebKurier Admin Panel*\n\n"
    "Доступные команды:\n"
    "• /status — статус системы и сервисов\n"
    "• /health — проверка работоспособности\n"
    "• /agents — список активных агентов\n"
    "• /agent_on <agent> — включить агента\n"
    "• /agent_off <agent> — отключить агента\n"
    "• /agent_restart <agent> — перезапустить агента\n\n"
    "Подсказка:\n"
    "— Используй /help для расширенной справки.\n"
    "— Команды работают только в личных сообщениях."
)

ADMIN_HELP_TEXT = (
    "📘 *Справка администратора WebKurier*\n\n"
    "🧩 Диагностика:\n"
    "• /status — краткий статус Core/PhoneCore/Security/Chain/DroneHub\n"
    "• /health — ping/uptime/очереди/ошибки\n\n"
    "🤖 Управление агентами:\n"
    "• /agents — список агентов (ON/OFF, версия, нагрузка)\n"
    "• /agent_on <agent> — включить агента\n"
    "• /agent_off <agent> — отключить агента\n"
    "• /agent_restart <agent> — перезапустить агента\n\n"
    "🧠 Примеры:\n"
    "• /agent_on translator\n"
    "• /agent_restart voice\n\n"
    "🔐 Безопасность:\n"
    "— админ-команды доступны только allowlist (ADMIN_IDS)\n"
    "— в группах админ-бот не работает"
)

def ensure_admin(message: Message) -> bool:
    uid = message.from_user.id if message.from_user else None
    if not is_admin(uid):
        return False
    return True

@router.message(Command("start"))
async def cmd_start(message: Message):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return
    await message.answer(ADMIN_START_TEXT, parse_mode=ParseMode.MARKDOWN)

@router.message(Command("help"))
async def cmd_help(message: Message):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return
    await message.answer(ADMIN_HELP_TEXT, parse_mode=ParseMode.MARKDOWN)

@router.message(Command("status"))
async def cmd_status(message: Message):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    async with aiohttp.ClientSession() as session:
        res = await core_api_call(session, "GET", "/status")

    if not res.get("ok"):
        await message.answer(f"❌ /status error: {res.get('error', 'unknown')}")
        return

    data = res.get("data") or {}
    # ожидаем примерно: {"core":"ok","security":"ok",...}
    text = fmt_kv("✅ Status", data) if isinstance(data, dict) else f"✅ Status:\n{data}"
    await message.answer(text, parse_mode=ParseMode.MARKDOWN)

@router.message(Command("health"))
async def cmd_health(message: Message):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    async with aiohttp.ClientSession() as session:
        res = await core_api_call(session, "GET", "/health")

    if not res.get("ok"):
        await message.answer(f"❌ /health error: {res.get('error', 'unknown')}")
        return

    data = res.get("data") or {}
    text = fmt_kv("✅ Health", data) if isinstance(data, dict) else f"✅ Health:\n{data}"
    await message.answer(text, parse_mode=ParseMode.MARKDOWN)

@router.message(Command("agents"))
async def cmd_agents(message: Message):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    async with aiohttp.ClientSession() as session:
        res = await core_api_call(session, "GET", "/agents")

    if not res.get("ok"):
        await message.answer(f"❌ /agents error: {res.get('error', 'unknown')}")
        return

    data = res.get("data") or []
    if isinstance(data, list) and data:
        # ожидаем список объектов: [{"name":"translator","state":"ON","version":"..."}]
        lines = ["🤖 *Agents*"]
        for a in data:
            if isinstance(a, dict):
                name = a.get("name", "?")
                state = a.get("state", "?")
                ver = a.get("version", "")
                load = a.get("load", "")
                tail = " ".join([x for x in [ver and f"v{ver}", load and f"load:{load}"] if x])
                lines.append(f"• `{name}` — *{state}*{(' — ' + tail) if tail else ''}")
            else:
                lines.append(f"• `{a}`")
        await message.answer("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
    else:
        await message.answer("🤖 Agents: (empty)")

def _arg_after_command(message: Message) -> str:
    """
    Возвращает текст после команды, например:
    "/agent_on translator" -> "translator"
    """
    text = (message.text or "").strip()
    parts = text.split(maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else ""

async def _agent_action(message: Message, action: str):
    if not ensure_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    agent = _arg_after_command(message)
    if not agent:
        await message.answer(f"ℹ️ Использование: /{action} <agent>\nПример: /{action} translator")
        return

    async with aiohttp.ClientSession() as session:
        res = await core_api_call(session, "POST", f"/agents/{action}", payload={"agent": agent})

    if not res.get("ok"):
        await message.answer(f"❌ /{action} error: {res.get('error', 'unknown')}")
        return

    data = res.get("data") or {}
    msg = data.get("message") if isinstance(data, dict) else None
    await message.answer(f"✅ {action}: `{agent}`\n{msg or ''}".strip(), parse_mode=ParseMode.MARKDOWN)

@router.message(Command("agent_on"))
async def cmd_agent_on(message: Message):
    await _agent_action(message, "on")

@router.message(Command("agent_off"))
async def cmd_agent_off(message: Message):
    await _agent_action(message, "off")

@router.message(Command("agent_restart"))
async def cmd_agent_restart(message: Message):
    await _agent_action(message, "restart")

@router.message(F.text)
async def fallback_text(message: Message):
    """
    Безопасный fallback: ничего не выполняем по произвольному тексту.
    Можно подсказать /help.
    """
    if not ensure_admin(message):
        # Для не-админов вообще не раскрываем наличие команд
        return
    await message.answer("ℹ️ Не понял команду. Используй /help")

# ---------------------------
# Main
# ---------------------------
async def main():
    bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher()
    dp.include_router(router)

    log.info("Admin bot started. Core API: %s", CORE_ADMIN_API_URL)
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())