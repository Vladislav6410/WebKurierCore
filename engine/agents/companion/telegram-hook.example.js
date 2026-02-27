import { runCompanion } from "./companion-router.js";

export async function handleCompanionCommand(ctx) {
  const text = (ctx.message?.text || "").replace(/^\/companion\s*/i, "").trim();
  const requester = { telegramId: String(ctx.from?.id || ""), userId: "" };

  const result = await runCompanion(text || "проверь структуру проекта", requester);

  const msg = [
    `🧩 Companion v1`,
    `Action: ${result.action}`,
    `Status: ${result.ok ? "✅ OK" : "❌ FAIL"}`,
    result.stderr ? `stderr:\n${result.stderr}` : "",
    result.stdout ? `stdout:\n${result.stdout}` : ""
  ].filter(Boolean).join("\n\n");

  return ctx.reply(msg.slice(0, 3500));
}