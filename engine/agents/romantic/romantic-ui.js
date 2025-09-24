// engine/agents/romantic/romantic-ui.js
import RomanticAgent from './romantic-agent.js';
const agent = new RomanticAgent({ default_mode: 'chat' });

window.send = async () => {
  const input = document.getElementById('input').value.trim();
  const mode  = document.getElementById('mode').value;
  const out   = document.getElementById('out');
  if (!input) return;
  out.textContent = 'Typing…';
  const ans = await agent.handle(input, { mode });
  out.textContent = ans;
};
window.clearOut = () => document.getElementById('out').textContent = '';