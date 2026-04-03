import fs from "fs/promises";
import path from "path";
import { createId, nowIso } from "./taskflow-utils.js";

const STATE_DIR = path.resolve("engine/taskflow/state");

async function ensureStateDir() {
  await fs.mkdir(STATE_DIR, { recursive: true });
}

function getTaskFile(taskId) {
  return path.join(STATE_DIR, `${taskId}.json`);
}

export async function createTaskRecord(task) {
  await ensureStateDir();

  const taskId = task.taskId || createId("task");
  const record = {
    ...task,
    taskId,
    createdAt: task.createdAt || nowIso(),
    updatedAt: nowIso()
  };

  await fs.writeFile(getTaskFile(taskId), JSON.stringify(record, null, 2), "utf-8");
  return record;
}

export async function saveTaskRecord(task) {
  await ensureStateDir();

  const record = {
    ...task,
    updatedAt: nowIso()
  };

  await fs.writeFile(getTaskFile(task.taskId), JSON.stringify(record, null, 2), "utf-8");
  return record;
}

export async function loadTaskRecord(taskId) {
  const raw = await fs.readFile(getTaskFile(taskId), "utf-8");
  return JSON.parse(raw);
}

export async function listTaskRecords() {
  await ensureStateDir();
  const files = await fs.readdir(STATE_DIR);
  const jsonFiles = files.filter(name => name.endsWith(".json"));

  const result = [];
  for (const fileName of jsonFiles) {
    const raw = await fs.readFile(path.join(STATE_DIR, fileName), "utf-8");
    result.push(JSON.parse(raw));
  }

  result.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return result;
}