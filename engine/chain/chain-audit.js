export async function chainAudit(event) {
  // MVP: просто console. Потом: HTTP в WebKurierChain API.
  console.log("[chain-audit]", JSON.stringify(event));
  return { ok: true };
}