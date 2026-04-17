import type { SecurityCheckResult } from '../types/SecurityCheck';

export interface CacheManager {
  get(key: string): Promise<SecurityCheckResult | null>;
  set(key: string, value: SecurityCheckResult, ttlSeconds: number): Promise<void>;
  delete?(key: string): Promise<void>;
  clear?(): Promise<void>;
}

interface MemoryCacheEntry {
  value: SecurityCheckResult;
  expiresAt: number;
}

export class InMemoryCacheManager implements CacheManager {
  private readonly store = new Map<string, MemoryCacheEntry>();

  async get(key: string): Promise<SecurityCheckResult | null> {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(
    key: string,
    value: SecurityCheckResult,
    ttlSeconds: number,
  ): Promise<void> {
    const ttlMs = Math.max(1, ttlSeconds) * 1000;

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}