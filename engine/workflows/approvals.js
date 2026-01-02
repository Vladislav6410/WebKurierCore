/**
 * In-memory approvals store (MVP).
 * Потом можно заменить на DB + Chain audit.
 */

const approvals = new Map();
// key = approvalId

function nowISO() {
  return new Date().toISOString();
}

export function createApproval({
  runId,
  stepId,
  title,
  message,
  timeoutSeconds = 86400
}) {
  const approvalId = `${runId}:${stepId}`;

  const record = {
    approvalId,
    runId,
    stepId,
    title,
    message,
    status: "pending", // pending | approved | rejected | expired
    createdAt: nowISO(),
    decidedAt: null,
    decision: null
  };

  approvals.set(approvalId, record);
  return record;
}

export function listApprovals() {
  return Array.from(approvals.values());
}

export function getApproval(approvalId) {
  return approvals.get(approvalId);
}

export function resolveApproval(approvalId, decision, comment = "") {
  const rec = approvals.get(approvalId);
  if (!rec) throw new Error("Approval not found");
  if (rec.status !== "pending") throw new Error("Approval already resolved");

  rec.status = decision === "approve" ? "approved" : "rejected";
  rec.decision = { decision, comment };
  rec.decidedAt = nowISO();

  approvals.set(approvalId, rec);
  return rec;
}