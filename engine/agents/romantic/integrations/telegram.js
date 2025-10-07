/**
 * Romantic Agent — Telegram Integration (funnel-ready)
 * ----------------------------------------------------
 * Режимы:
 *  - FUNNEL: отправляем апдейты в общую шину /webhook/ingest
 *  - LOCAL:  используем локальное ядро RomanticAgent (как раньше)
 *
 * ENV:
 *   TELEGRAM_TOKEN=...
 *   FUNNEL_API=https://<your-api>/webhook/ingest   # опционально, включает FUNNEL
 */

import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Фолбэк на локальное ядро (при отсутствии FUNNEL_API)
let LocalAgent = null;
try {
  const mod = await import('../romantic-agent.js');
  LocalAgent = mod.RomanticAgent || null;
} catch { /* локальное ядро опционально */ }

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('⚠️ TELEGRAM_TOKEN не найден. Установи переменную окружения перед запуском.');
  process.exit(1);
}

const FUNNEL_API = process.env.FUNNEL_API || '';
const MODE = FUNNEL_API ? 'FUNNEL' : 'LOCAL';
const bot = new TelegramBot(token, { polling: true });
const agent = MODE === 'LOCAL' && LocalAgent ? new LocalAgent() : null;

console.log(`💌 Romantic Agent Telegram бот запущен... Режим: ${MODE}`);

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  if (text.startsWith('/start')) {
    await bot.sendMessage(
      chatId,
      '💞 Привет! Я — Romantic Agent. Напиши что-нибудь, и я постараюсь ответить романтично ✨'
    );
    return;
  }

  try {
    if (MODE === 'FUNNEL') {
      // Отправляем событие в общую шину → она решит, как ответить
      const { data } = await axios.post(FUNNEL_API, {
        channel: 'telegram',
        agent: 'romantic',
        payload: { message: msg }        // оригинальный апдейт
      }, { timeout: 10000 });

      const reply = data?.reply ?? '…';
      await bot.sendMessage(chatId, reply);
    } else {
      // Локальный фолбэк (как раньше)
      if (!agent) throw new Error('Локальное ядро недоступно');
      const reply = await agent.handle(text, { userId: chatId, mode: 'chat' });
      await bot.sendMessage(chatId, reply);
    }
  } catch (err) {
    console.error('Ошибка при обработке сообщения:', err?.message || err);
    await bot.sendMessage(chatId, '😔 Извини, сейчас что-то пошло не так...');
  }
});