const API_BASE = "/api/autopilot";

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const err = await parseJsonSafe(response);
    throw new Error(err.detail || `GET failed: ${response.status}`);
  }
  return parseJsonSafe(response);
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await parseJsonSafe(response);
    throw new Error(err.detail || `POST failed: ${response.status}`);
  }
  return parseJsonSafe(response);
}

export async function getStatus() {
  return getJson("/status");
}

export async function getTelemetry() {
  return getJson("/telemetry/live");
}

export async function getActionLog(limit = 20) {
  return getJson(`/action-log/list?limit=${limit}`);
}

export async function verifyChain(limit = 100) {
  return getJson(`/action-log/verify?limit=${limit}`);
}

export async function buildMission(payload) {
  return postJson("/mission/build", payload);
}

export async function validateMission(payload) {
  return postJson("/mission/validate", payload);
}

export async function uploadMission(payload) {
  return postJson("/mission/upload", payload);
}

export async function sendAction(action, operatorToken) {
  return postJson("/mission/action", {
    action,
    operator_token: operatorToken
  });
}

export async function issueMissionCertificate(payload) {
  return postJson("/mission/certificate/issue", payload);
}

export async function getMissionCertificate(missionId) {
  return getJson(`/mission/certificate/get/${encodeURIComponent(missionId)}`);
}