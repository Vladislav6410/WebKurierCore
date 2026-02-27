import fs from "node:fs";
import path from "node:path";

function storeDir() {
  const base = process.env.WDA_WORKSPACE || "/var/lib/webkurier/wda-workspace";
  const dir = path.join(base, "jobs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveJob(job) {
  const p = path.join(storeDir(), `${job.jobId}.json`);
  fs.writeFileSync(p, JSON.stringify(job, null, 2), "utf-8");
  return p;
}

export function listJobs(limit = 50) {
  const dir = storeDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).slice(-limit);
  return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
}

export function saveTask(task) {
  const base = process.env.WDA_WORKSPACE || "/var/lib/webkurier/wda-workspace";
  const p = path.join(base, "tasks.json");
  const tasks = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
  tasks.push(task);
  fs.writeFileSync(p, JSON.stringify(tasks, null, 2), "utf-8");
  return p;
}

export function loadTasks() {
  const base = process.env.WDA_WORKSPACE || "/var/lib/webkurier/wda-workspace";
  const p = path.join(base, "tasks.json");
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}