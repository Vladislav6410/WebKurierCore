/**
 * Romantic Agent — WhatsApp Integration (Baileys)
 * -----------------------------------------------
 * Лёгкий коннектор на базе @adiwajshing/baileys.
 * Пересылает входящие сообщения в ядро romantic-agent.js
 * и отправляет ответ.
 *
 * Установка:
 *   npm install @adiwajshing/baileys qrcode-terminal
 *
 * Первый запуск создаст локальную папку сессии .wa-auth-romantic/
 * (её нужно добавить в .gitignore, см. ниже).
 */

import makeWASocket, {
  useMultiFileAuthState,
  Browsers
} from '@adiwajshing/baileys';
import qrcode from 'qrcode-terminal';
import { RomanticAgent } from '../romantic-agent.js';

const SESSION_DIR = new URL('../.wa-auth-romantic', import.meta.url).pathname;
const agent = new RomanticAgent();

export async function startWhatsApp() {
  // файловое хранилище ключей/сессии (не хранить в git!)
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.appropriate('WebKurier', 'Romantic', '1.0')
  });

  // сохраняем обновления ключей
  sock.ev.on('creds.update', saveCreds);

  // QR + статус соединения
  sock.ev.on('connection.update', ({ qr, connection, lastDisconnect }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log('💚 WhatsApp connected.');
    if (connection === 'close') {
      console.log('WhatsApp closed:', lastDisconnect?.error?.message || 'unknown');
    }
  });

  // входящие сообщения
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages?.[0];
      if (!m || m.key.fromMe) return;

      const jid = m.key.remoteJid;
      const text =
        m.message?.conversation ??
        m.message?.extendedTextMessage?.text ??
        m.message?.imageMessage?.caption ??
        m.message?.videoMessage?.caption ??
        '';

      if (!text) return;

      if (text.startsWith('/start')) {
        await sock.sendMessage(jid, { text: '💞 Привет! Я — Romantic Agent. Напиши мне ✨' });
        return;
      }

      const reply = await agent.handle(text, { userId: jid, mode: 'chat' });
      await sock.sendMessage(jid, { text: reply });
    } catch (err) {
      console.error('WA handler error:', err);
    }
  });

  return sock;
}

// Запуск напрямую: node engine/agents/romantic/integrations/whatsapp.js
if (import.meta.url === `file://${process.argv[1]}`) {
  startWhatsApp().catch((e) => {
    console.error('WA start error:', e);
    process.exit(1);
  });
}