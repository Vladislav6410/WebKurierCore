const API_BASE = import.meta?.env?.VITE_DRONEHYBRID_API || "http://localhost:3000";

export function getApiBase() {
  return API_BASE;
}

export async function listMissions() {
  const r = await fetch(`${API_BASE}/api/missions`);
  if (!r.ok) throw new Error("Failed to list missions");
  return r.json();
}

export async function createMission(formData) {
  const r = await fetch(`${API_BASE}/api/missions`, { method: "POST", body: formData });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getMission(id) {
  const r = await fetch(`${API_BASE}/api/missions/${id}`);
  if (!r.ok) throw new Error("Mission not found");
  return r.json();
}

export async function startProcessing(id, type) {
  const r = await fetch(`${API_BASE}/api/missions/${id}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function connectTelemetryWs(onMessage) {
  const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws/telemetry";
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      onMessage?.(msg);
    } catch (_) {}
  };

  return ws;
}