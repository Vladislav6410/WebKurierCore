from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.enums import ParseMode

from ..security import is_admin
from ..keyboards.companion import companion_keyboard

router = Router()

START_TEXT = (
    "🛠 *WebKurier Admin Panel*\n\n"
    "✨ Companion v1 — быстрые сценарии:\n"
    "• Проверка структуры проекта\n"
    "• Линтер\n"
    "• Тесты\n"
    "• Логи\n\n"
    "Основные команды:\n"
    "• /status — статус системы и сервисов\n"
    "• /health — проверка работоспособности\n"
    "• /agents — список активных агентов\n"
    "• /agent_on <agent> — включить агента\n"
    "• /agent_off <agent> — отключить агента\n"
    "• /agent_restart <agent> — перезапустить агента\n\n"
    "Используй /help для расширенной справки.\n"
    "Команды работают только в личных сообщениях."
)

@router.message(Command("start"))
async def admin_start(message: Message):
    if not is_admin(message):
        await message.answer("⛔ Доступ запрещён.")
        return

    await message.answer(
        START_TEXT,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=companion_keyboard()  # ✅ добавили кнопки
    )