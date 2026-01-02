export const HumanApprovalStep = {
  type: "human.approval",
  async execute(config, ctx) {
    // MVP: возвращаем pending.
    // Следующий шаг: связать с UI (кнопки Approve/Reject) и хранить решение в store/chain.
    return {
      status: "pending",
      title: config.title || "Approval required",
      message: config.message || "Approve or reject",
      timeoutSeconds: config.timeoutSeconds || 86400
    };
  }
};