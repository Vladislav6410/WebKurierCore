from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.enums import ParseMode

from ..security import is_admin

router = Router()

HELP_TEXT = (
    "📘 *Справка администратора WebKurier*\n\n"
    "🧩 Диагностика:\n"
    "• /status — статус Core / PhoneCore / Security / Chain\n"
    "• /health — ping, uptime, ошибки\n\n"
    "🤖 Управление агентами:\n"
    "• /agents — список агентов\n"
    "• /agent_on <agent>\n"
    "• /agent_off <agent>\n"
    "• /agent_restart <agent>\n\n"
    "🧠 Примеры:\n"
    "• /agent_on translator\n"
    "• /agent_restart voice\n\n"
    "🔐 Команды доступны только администраторам."
)

@router.message(Command("help"))
async def admin_help(message: Message):
    if not is_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    await message.answer(HELP_TEXT, parse_mode=ParseMode.MARKDOWN)