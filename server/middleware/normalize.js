// Ожидает input вида {channel, agent, payloadFromChannel}
// твои интеграции TG/WA просто добавят agent=<имя папки> и payload
export default function normalize(input){
  const { channel, agent, payload } = input;
  if(channel === 'telegram'){
    const b = payload; // оригинальный update
    return {
      agent, channel,
      user: { id:`tg:${b.message.from.id}`, name:b.message.from.first_name, locale:'ru' },
      message: { text:b.message.text, ts:b.message.date },
      session: { stage:'onboarding' }
    };
  }
  if(channel === 'whatsapp'){
    const m = payload.message;
    return {
      agent, channel,
      user: { id:`wa:${m.from}`, locale:'ru' },
      message: { text:m.text, ts:Date.now() },
      session: { stage:'onboarding' }
    };
  }
  return input;
}