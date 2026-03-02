import { runInSandbox } from "../sandbox/sandboxRunner.js";

// применяем diff через git apply в /repo (нужен RW профиль или отдельный импорт-профиль)
// v1: применяем на host вне sandbox безопасным allowlist (лучше), но покажу вариант через git в sandbox
export async function patchApplyUnified(job, profile) {
  const diff = String(job?.args?.unifiedDiff || "");
  if (!diff || diff.length < 10) throw new Error("unifiedDiff empty");

  const script = `
set -euo pipefail
cd /repo
# проверим что git есть
command -v git >/dev/null 2>&1 || { echo "git missing"; exit 2; }

# dry run first
printf "%s" "$DIFF" | git apply --check

# apply
printf "%s" "$DIFF" | git apply

echo "RESULT=OK"
`;

  return await runInSandbox({
    cmd: "bash",
    args: ["-lc", script],
    profile,
    job,
    envExtra: { DIFF: diff }
  });
}