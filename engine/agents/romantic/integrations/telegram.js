/**
 * Romantic Agent — Telegram Integration
 * -------------------------------------
 * Коннектор для работы через Telegram-бота.
 * Использует библиотеку node-telegram-bot-api.
 *
 * Установка:
 *   npm install node-telegram-bot-api
 *
 * Запуск (после задания токена):
 *   TELEGRAM_TOKEN=123456789:ABCDEF... node engine/agents/romantic/integrations/telegram.js
 */

import TelegramBot from 'node-telegram-bot-api';
import { RomanticAgent } from '../romantic-agent.js';

const token = process.env.TELEGRAM_TOKEN || '';
if (!token) {
  console.error('❌ TELEGRAM_TOKEN не задан. Установите переменную окружения.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const agent = new RomanticAgent();

console.log('💌 Romantic Agent — Telegram бот запущен...');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || msg.caption || '';

  if (!text) return;

  // Примитивная команда старта
  if (text.startsWith('/start')) {
    await bot.sendMessage(chatId, '💞 Привет! Я Romantic Agent. Напиши мне что-нибудь романтичное.');
    return;
  }

  try {
    const reply = await agent.handle(text, { userId: chatId, mode: 'chat' });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('Ошибка обработки сообщения:', err);
    await bot.sendMessage(chatId, '⚠️ Ошибка обработки. Попробуйте позже.');
  }
});