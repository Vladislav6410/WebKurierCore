import crypto from "crypto";

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix = "tf") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function safeError(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || "Unknown error",
    stack: error?.stack || null
  };
}