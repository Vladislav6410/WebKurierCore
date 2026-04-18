import { Redis } from 'ioredis';
import type { SecurityCheckResult } from '../types/SecurityCheck.js';
import type { CacheManager } from './CacheManager.js';

export class RedisCacheManager implements CacheManager {
  private readonly redis: Redis;

  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL is required for RedisCacheManager');
    }
    this.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async get(key: string): Promise<SecurityCheckResult | null> {
    await this.ensureConnected();
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SecurityCheckResult;
    } catch {
      await this.redis.del(key);
      return null;
    }
  }

  async set(
    key: string,
    value: SecurityCheckResult,
    ttlSeconds: number,
  ): Promise<void> {
    await this.ensureConnected();
    await this.redis.set(key, JSON.stringify(value), 'EX', Math.max(1, ttlSeconds));
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnected();
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    await this.ensureConnected();
    await this.redis.flushdb();
  }

  async disconnect(): Promise<void> {
    if (this.redis.status === 'end') return;
    await this.redis.quit();
  }

  private async ensureConnected(): Promise<void> {
    if (this.redis.status === 'ready' || this.redis.status === 'connect') return;
    await this.redis.connect();
  }
}
