/**
 * Romantic Agent — Telegram Integration
 * --------------------------------------
 * Подключение к Telegram-боту через node-telegram-bot-api.
 * Сообщения пересылаются в ядро romantic-agent.js.
 *
 * Установка:
 *   npm install node-telegram-bot-api
 *
 * Запуск (Linux/macOS):
 *   export TELEGRAM_TOKEN=1234567890:ABCDEF...
 *   node engine/agents/romantic/integrations/telegram.js
 *
 * Запуск (Windows PowerShell):
 *   $env:TELEGRAM_TOKEN="1234567890:ABCDEF..."
 *   node engine/agents/romantic/integrations/telegram.js
 */

import TelegramBot from 'node-telegram-bot-api';
import { RomanticAgent } from '../romantic-agent.js';

const token = process.env.TELEGRAM_TOKEN;

if (!token) {
  console.error('⚠️ TELEGRAM_TOKEN не найден. Установи переменную окружения перед запуском.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const agent = new RomanticAgent();

console.log('💌 Romantic Agent Telegram бот запущен...');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  // приветственное сообщение
  if (text.startsWith('/start')) {
    await bot.sendMessage(
      chatId,
      '💞 Привет! Я — Romantic Agent. Напиши что-нибудь, и я постараюсь ответить романтично ✨'
    );
    return;
  }

  try {
    const reply = await agent.handle(text, { userId: chatId, mode: 'chat' });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('Ошибка при обработке сообщения:', err);
    await bot.sendMessage(chatId, '😔 Извини, сейчас что-то пошло не так...');
  }
});