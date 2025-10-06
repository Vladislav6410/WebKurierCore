// Мини-адаптер: приводит вход к твоему romantic-agent.js
import manifest from './agent.manifest.json' assert { type: 'json' };

export async function handle({ evt, state }){
  // динамически импортируем твое ядро
  const core = await import('./romantic-agent.js');
  const handleMessage = core.handleMessage || core.default || core.main;

  const res = await handleMessage({
    text: evt.message.text,
    user: evt.user,
    channel: evt.channel,
    state,
    manifest
  });

  // Ожидается { reply: '...', state: {...} } — приводим к контракту
  const reply = res.reply || res.text || '…';
  const nextState = res.state || state || {};
  return { reply, nextState };
}