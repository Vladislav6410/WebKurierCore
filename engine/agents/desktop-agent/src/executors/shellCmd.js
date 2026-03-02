import { patchApplyUnified } from "./patchApplyUnified.js";

export async function runExecutor(job, profile) {
  if (job.action === "patch_apply_unified") {
    return await patchApplyUnified(job, profile);
  }
  ...
}