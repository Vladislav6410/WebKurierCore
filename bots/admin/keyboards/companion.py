from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def companion_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="✅ Проверить структуру проекта")],
            [KeyboardButton(text="🧹 Запустить линтер")],
            [KeyboardButton(text="🧪 Прогнать тесты")],
            [KeyboardButton(text="📜 Показать последние логи")],
            [KeyboardButton(text="ℹ️ Статус системы")],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
        input_field_placeholder="Выбери действие или напиши команду…",
    )