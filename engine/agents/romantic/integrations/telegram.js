/**
 * Romantic Agent — Telegram Integration
 * --------------------------------------
 * Minimal Telegram bot connector.
 * Listens for messages and sends romantic replies
 * using romantic-agent.js core.
 */

import { RomanticAgent } from '../romantic-agent.js';
import TelegramBot from 'node-telegram-bot-api';
import config from '../config.json' assert { type: 'json' };

const token = config.telegram_token || process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('⚠️ Telegram token is missing. Add to config.json or env TELEGRAM_TOKEN');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const agent = new RomanticAgent();

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  // Simple command
  if (text.startsWith('/start')) {
    await bot.sendMessage(chatId, '💞 Hello! I am your Romantic Agent. Tell me something...');
    return;
  }

  // Pass message to Romantic Agent core
  const reply = await agent.respond(text, { userId: chatId });
  await bot.sendMessage(chatId, reply);
});

console.log('💌 Romantic Agent Telegram bot started...');