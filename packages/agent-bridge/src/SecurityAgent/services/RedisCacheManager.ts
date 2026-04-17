import type { CacheManager } from './CacheManager';

export class RedisCacheManager implements CacheManager {
  async get(): Promise<any> {
    throw new Error('RedisCacheManager not implemented yet');
  }

  async set(): Promise<void> {
    throw new Error('RedisCacheManager not implemented yet');
  }
}