/**
 * Romantic Agent — WhatsApp Integration (Baileys)
 * ------------------------------------------------
 * Минимальный коннектор через @adiwajshing/baileys.
 * Получает сообщения и отвечает через romantic-agent.js.
 *
 * Установка:
 *   npm i @adiwajshing/baileys qrcode-terminal
 */

import makeWASocket, { useMultiFileAuthState, Browsers } from '@adiwajshing/baileys';
import qrcode from 'qrcode-terminal';
import { RomanticAgent } from '../romantic-agent.js';

const agent = new RomanticAgent();

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./.wa-auth'); // папка с токенами

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.appropriate('WebKurier', 'Romantic', '1.0')
  });

  sock.ev.on('creds.update', saveCreds);

  // Отрисуем QR в терминале
  sock.ev.on('connection.update', (u) => {
    const { qr, connection, lastDisconnect } = u;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      console.log('WA closed:', lastDisconnect?.error?.message || 'unknown');
    } else if (connection === 'open') {
      console.log('💌 WhatsApp connected.');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg || msg.key.fromMe) return;

      const jid = msg.key.remoteJid;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

      if (!text) return;

      // Примитивные команды
      if (text.startsWith('/start')) {
        await sock.sendMessage(jid, { text: '💞 Hello! I am your Romantic Agent. Tell me something...' });
        return;
      }

      // Ответ через ядро агента
      const reply = await agent.handle(text, { userId: jid, mode: 'chat' });
      await sock.sendMessage(jid, { text: reply });
    } catch (e) {
      console.error('WA handler error:', e);
    }
  });

  return sock;
}

// Если нужно запускать напрямую: node whatsapp.js
if (import.meta.url === `file://${process.argv[1]}`) {
  startWhatsApp().catch((e) => {
    console.error('WA start error:', e);
    process.exit(1);
  });
}