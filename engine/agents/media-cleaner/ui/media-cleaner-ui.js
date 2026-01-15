const $ = (id) => document.getElementById(id);

function setOut(obj) {
  $("out").textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

async function api(path, body, method = "POST") {
  const resp = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
  return data;
}

$("btnStart").addEventListener("click", async () => {
  try {
    const userId = $("userId").value.trim();
    const deviceId = $("deviceId").value.trim();
    const mode = $("mode").value;

    const out = await api("/api/media-cleaner/session/start", { userId, deviceId, mode });
    $("sessionId").value = out?.session?.sessionId || "";
    setOut(out);
  } catch (e) {
    setOut({ ok: false, error: String(e.message || e) });
  }
});

$("btnList").addEventListener("click", async () => {
  try {
    const userId = $("userId").value.trim();
    const resp = await fetch(`/api/media-cleaner/sessions?userId=${encodeURIComponent(userId)}`);
    const data = await resp.json();
    setOut(data);
  } catch (e) {
    setOut({ ok: false, error: String(e.message || e) });
  }
});

$("btnSubmit").addEventListener("click", async () => {
  try {
    const userId = $("userId").value.trim();
    const sessionId = $("sessionId").value.trim();

    let resultsSummary;
    try {
      resultsSummary = JSON.parse($("resultsSummary").value);
    } catch {
      throw new Error("resultsSummary must be valid JSON");
    }

    const out = await api("/api/media-cleaner/session/submit", { userId, sessionId, resultsSummary });
    setOut(out);
  } catch (e) {
    setOut({ ok: false, error: String(e.message || e) });
  }
});

$("btnReward").addEventListener("click", async () => {
  try {
    const userId = $("userId").value.trim();
    const sessionId = $("sessionId").value.trim();
    const freedBytes = Number($("freedBytes").value || 0);

    const out = await api("/api/media-cleaner/reward", { userId, sessionId, freedBytes });
    setOut(out);
  } catch (e) {
    setOut({ ok: false, error: String(e.message || e) });
  }
});