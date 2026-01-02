import { resolveApproval, getApproval, listApprovals } from "../engine/workflows/approvals.js";

export function registerApprovalRoutes(app) {
  app.get("/api/approvals", (req, res) => {
    res.json(listApprovals());
  });

  app.get("/api/approvals/:id", (req, res) => {
    const a = getApproval(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  app.post("/api/approvals/:id/approve", (req, res) => {
    const a = resolveApproval(req.params.id, "approve", req.body?.comment);
    res.json(a);
  });

  app.post("/api/approvals/:id/reject", (req, res) => {
    const a = resolveApproval(req.params.id, "reject", req.body?.comment);
    res.json(a);
  });
}