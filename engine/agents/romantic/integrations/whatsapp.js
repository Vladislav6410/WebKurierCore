/**
 * Romantic Agent — WhatsApp Integration (Baileys) — funnel-ready
 * --------------------------------------------------------------
 * Режимы:
 *  - FUNNEL: отправляем события в общую шину /webhook/ingest (рекомендуется)
 *  - LOCAL:  используем локальное ядро RomanticAgent (как раньше)
 *
 * ENV:
 *   FUNNEL_API=https://<your-api>/webhook/ingest   # включает режим FUNNEL
 *   (опционально) WA_SESSION_DIR=engine/agents/romantic/.wa-auth-romantic
 *
 * Запуск:
 *   node engine/agents/romantic/integrations/whatsapp.js
 */

import makeWASocket, {
  useMultiFileAuthState,
  Browsers
} from '@adiwajshing/baileys';
import qrcode from 'qrcode-terminal';
import axios from 'axios';

// Фолбэк на локальное ядро (при отсутствии FUNNEL_API)
let LocalAgent = null;
try {
  const mod = await import('../romantic-agent.js');
  LocalAgent = mod.RomanticAgent || null;
} catch { /* локальное ядро необязательно */ }

const DEFAULT_SESSION_DIR = new URL('../.wa-auth-romantic', import.meta.url).pathname;
const SESSION_DIR = process.env.WA_SESSION_DIR || DEFAULT_SESSION_DIR;

const FUNNEL_API = process.env.FUNNEL_API || '';
const MODE = FUNNEL_API ? 'FUNNEL' : 'LOCAL';
const agent = MODE === 'LOCAL' && LocalAgent ? new LocalAgent() : null;

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.appropriate('WebKurier', 'Romantic', '1.0')
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ qr, connection, lastDisconnect }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log(`💚 WhatsApp connected. Mode: ${MODE}`);
    if (connection === 'close') {
      console.log('WhatsApp closed:', lastDisconnect?.error?.message || 'unknown');
    }
  });

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

      if (MODE === 'FUNNEL') {
        // Отправляем событие в общую шину — она вернёт текст ответа
        const { data } = await axios.post(FUNNEL_API, {
          channel: 'whatsapp',
          agent: 'romantic',
          payload: { message: { from: jid, text } }
        }, { timeout: 10000 });

        const reply = data?.reply ?? '…';
        await sock.sendMessage(jid, { text: reply });
      } else {
        if (!agent) throw new Error('Локальное ядро недоступно');
        const reply = await agent.handle(text, { userId: jid, mode: 'chat' });
        await sock.sendMessage(jid, { text: reply });
      }
    } catch (err) {
      console.error('WA handler error:', err?.message || err);
    }
  });

  return sock;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startWhatsApp().catch((e) => {
    console.error('WA start error:', e);
    process.exit(1);
  });
}