/**
 * Local Core storage abstraction (SQLite / JSON / Supabase later).
 * For now we keep it simple: JSON-based storage adapter.
 */

import fs from "fs";
import path from "path";

export class MediaCleanerStorage {
  constructor({ baseDir = "engine/data/media-cleaner" } = {}) {
    this.baseDir = baseDir;
    this.sessionsFile = path.join(this.baseDir, "sessions.json");
    this.resultsFile = path.join(this.baseDir, "results.json");
    this._ensure();
  }

  _ensure() {
    fs.mkdirSync(this.baseDir, { recursive: true });
    if (!fs.existsSync(this.sessionsFile)) fs.writeFileSync(this.sessionsFile, JSON.stringify([]));
    if (!fs.existsSync(this.resultsFile)) fs.writeFileSync(this.resultsFile, JSON.stringify([]));
  }

  _read(file) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }

  _write(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  async saveSession(session) {
    const all = this._read(this.sessionsFile);
    all.push(session);
    this._write(this.sessionsFile, all);
  }

  async listSessions({ userId }) {
    const all = this._read(this.sessionsFile);
    return all.filter((s) => s.userId === userId).slice(-50).reverse();
  }

  async saveResultsSummary({ userId, sessionId, resultsSummary }) {
    const all = this._read(this.resultsFile);
    all.push({
      userId,
      sessionId,
      resultsSummary,
      savedAt: new Date().toISOString(),
    });
    this._write(this.resultsFile, all);
  }
}