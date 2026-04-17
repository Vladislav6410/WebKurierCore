// === Core adapter ===
export { SecuritySearchAdapter } from './SecuritySearchAdapter';

// === Services ===
export { UrlSanitizer } from './services/UrlSanitizer';
export { RiskCalculator } from './services/RiskCalculator';
export {
  InMemoryCacheManager,
} from './services/CacheManager';
export type {
  CacheManager,
} from './services/CacheManager';
export { RedisCacheManager } from './services/RedisCacheManager';

// === Types ===
export type {
  SecurityCheckConfig,
  SecurityCheckResult,
  SecurityMode,
  SecuritySource,
  SecurityVerdict,
  SecurityFinding,
  SecurityRecommendation,
} from './types/SecurityCheck';