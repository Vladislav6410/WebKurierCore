import { createApproval, getApproval } from "../approvals.js";

/**
 * Шаг создаёт approval и останавливает workflow.
 * Runner увидит status=pending и выйдет.
 */
export const HumanApprovalStep = {
  type: "human.approval",
  async execute(config, ctx) {
    const title = config.title || "Approval required";
    const message = config.message || "Please approve or reject";
    const timeoutSeconds = config.timeoutSeconds || 86400;

    const approval = createApproval({
      runId: ctx.runId,
      stepId: config.stepId || "human.approval",
      title,
      message,
      timeoutSeconds
    });

    return {
      status: "pending",
      approvalId: approval.approvalId,
      title,
      message
    };
  }
};
