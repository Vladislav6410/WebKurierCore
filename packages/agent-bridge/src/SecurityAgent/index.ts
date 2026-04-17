// === Core adapter ===
export { SecuritySearchAdapter } from './SecuritySearchAdapter';

// === Services ===
export { UrlSanitizer } from './services/UrlSanitizer';
export { RiskCalculator } from './services/RiskCalculator';
export {
  CacheManager,
  InMemoryCacheManager,
} from './services/CacheManager';

// 🔥 Новые сервисы
export { RedisCacheManager } from './services/RedisCacheManager';
export { ReputationAggregator } from './services/ReputationAggregator';

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