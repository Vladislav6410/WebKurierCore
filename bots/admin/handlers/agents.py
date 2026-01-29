from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from ..security import is_admin
from ..services.core_api import core_get, core_post

router = Router()


def extract_agent_name(message: Message) -> str:
    parts = (message.text or "").split(maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else ""


@router.message(Command("agents"))
async def list_agents(message: Message):
    if not is_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    result = await core_get("/agents")
    if not result["ok"]:
        await message.answer(f"❌ Ошибка: {result['error']}")
        return

    agents = result.get("data", [])
    if not agents:
        await message.answer("🤖 Агенты не найдены.")
        return

    lines = ["🤖 *Активные агенты:*"]
    for a in agents:
        name = a.get("name", "?")
        state = a.get("state", "?")
        lines.append(f"• `{name}` — *{state}*")

    await message.answer("\n".join(lines), parse_mode="Markdown")


@router.message(Command("agent_on"))
async def agent_on(message: Message):
    await agent_action(message, "on")


@router.message(Command("agent_off"))
async def agent_off(message: Message):
    await agent_action(message, "off")


@router.message(Command("agent_restart"))
async def agent_restart(message: Message):
    await agent_action(message, "restart")


async def agent_action(message: Message, action: str):
    if not is_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    agent = extract_agent_name(message)
    if not agent:
        await message.answer(f"ℹ️ Использование: /agent_{action} <agent>")
        return

    result = await core_post(f"/agents/{action}", {"agent": agent})
    if not result["ok"]:
        await message.answer(f"❌ Ошибка: {result['error']}")
        return

    await message.answer(f"✅ Агент `{agent}`: {action}", parse_mode="Markdown")