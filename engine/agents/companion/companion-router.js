import { signJob } from "../../integrations/wda/job-signer.js";
import { sendJobToWDA } from "../../integrations/wda/wda-client.js";

// Minimal intent routing (v1). Later: LLMRouter classifyTask.
function classify(text = "") {
  const t = text.toLowerCase();

  if (t.includes("проверь") && (t.includes("структур") || t.includes("репо") || t.includes("проект"))) return "repo_tree_check";
  if (t.includes("линт") || t.includes("lint")) return "lint";
  if (t.includes("тест") || t.includes("test")) return "tests";
  if (t.includes("собери") || t.includes("build")) return "build";
  if (t.includes("логи") || t.includes("log")) return "read_logs";

  return "repo_tree_check";
}

export async function runCompanion(text, requester) {
  const action = classify(text);

  const baseJob = {
    jobId: `comp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    requester: {
      telegramId: requester.telegramId,
      userId: requester.userId
    },
    action,
    target: "WebKurierCore",
    args: { text }
  };

  const signed = signJob(baseJob);
  return await sendJobToWDA(signed);
}