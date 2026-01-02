import fs from "fs";
import path from "path";

/**
 * Загружает workflow JSON с диска.
 * Поддерживает:
 * - абсолютный путь
 * - относительный путь от корня проекта
 * - относительный путь от текущей директории процесса
 */
export function loadWorkflowFromFile(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("workflow path is required");
  }

  const normalized = filePath.trim();

  const candidates = [
    normalized,
    path.join(process.cwd(), normalized),
    path.join(process.cwd(), "engine", "workflows", normalized)
  ];

  let resolved = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      resolved = c;
      break;
    }
  }

  if (!resolved) {
    throw new Error(
      `Workflow file not found. Tried:\n- ${candidates.join("\n- ")}`
    );
  }

  const raw = fs.readFileSync(resolved, "utf8");
  try {
    const wf = JSON.parse(raw);
    return { workflow: wf, resolvedPath: resolved };
  } catch (e) {
    throw new Error(`Invalid JSON in workflow file: ${resolved}\n${e.message}`);
  }
}