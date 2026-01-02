import { createRegistry } from "./registry.js";
import { createRunStore } from "./store.js";

import { ManualTrigger } from "./triggers/manual.js";
import { WebhookTrigger } from "./triggers/webhook.js";
import { ScheduleTrigger } from "./triggers/schedule.js";

import { DataTransformStep } from "./steps/data.transform.js";
import { AiPromptStep } from "./steps/ai.prompt.js";
import { HttpRequestStep } from "./steps/http.request.js";
import { HumanApprovalStep } from "./steps/human.approval.js";

export function createWorkflowRuntime() {
  const registry = createRegistry();
  const store = createRunStore();

  // triggers
  registry.registerTrigger(ManualTrigger.type, ManualTrigger);
  registry.registerTrigger(WebhookTrigger.type, WebhookTrigger);
  registry.registerTrigger(ScheduleTrigger.type, ScheduleTrigger);

  // steps
  registry.registerStep(DataTransformStep.type, DataTransformStep);
  registry.registerStep(AiPromptStep.type, AiPromptStep);
  registry.registerStep(HttpRequestStep.type, HttpRequestStep);
  registry.registerStep(HumanApprovalStep.type, HumanApprovalStep);

  return { registry, store };
}