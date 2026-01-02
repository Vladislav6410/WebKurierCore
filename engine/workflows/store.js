// In-memory store (позже заменим на SQLite/Redis/DB)
export function createRunStore() {
  const runs = new Map();

  return {
    createRun(run) {
      runs.set(run.id, run);
      return run;
    },
    getRun(id) {
      return runs.get(id);
    },
    updateRun(id, patch) {
      const r = runs.get(id);
      if (!r) throw new Error("Run not found");
      Object.assign(r, patch);
      runs.set(id, r);
      return r;
    },
    listRuns(limit = 50) {
      return Array.from(runs.values()).slice(-limit).reverse();
    }
  };
}