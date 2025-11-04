const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function withRetry(fn, { tries = 3, baseMs = 500 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { last = e; await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i))); }
  }
  throw last;
}

exports.checkRelayWorkflow = async ({ apiKey, workflowId }) => {
  const url = `https://api.relay.app/workflows/${workflowId}/status`;
  try {
    const res = await withRetry(() => fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }));
    if (!res.ok) throw new Error(`Relay HTTP ${res.status}`);
    const data = await res.json();
    if (data.state === 'ok') return { ok: true };
    return { ok: false, type: 'relay_state_'+data.state, message: data.error || 'state not ok', severity: data.state === 'failed' ? 'critical' : 'warning' };
  } catch (e) {
    return { ok: false, type: 'relay_request', message: e.message, severity: 'warning' };
  }
};

exports.restartRelayWorkflow = async ({ apiKey, workflowId, overrides = {} }) => {
  const url = `https://api.relay.app/workflows/${workflowId}/run`;
  const body = { overrides };
  const res = await withRetry(() => fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }));
  if (!res.ok) throw new Error(`Relay restart HTTP ${res.status}`);
  return res.json();
};