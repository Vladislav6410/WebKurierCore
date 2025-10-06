import axios from 'axios';
export async function track(payload){
  if(!process.env.MAKE_WEBHOOK_URL) return;
  try { await axios.post(process.env.MAKE_WEBHOOK_URL, payload); } catch {}
}