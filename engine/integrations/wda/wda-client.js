export async function sendJobToWDA(job) {
  const url = process.env.WDA_URL || "http://127.0.0.1:8787/jobs";
  const secret = process.env.CORE_SHARED_SECRET;

  if (!secret || secret.length < 20) throw new Error("CORE_SHARED_SECRET missing in Core env");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-core-secret": secret
    },
    body: JSON.stringify(job)
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`WDA error: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}