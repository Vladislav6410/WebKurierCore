import crypto from 'node:crypto';

import { WebSearchClient, SearchMode } from '@webkurier/websearch-core';
import type { SearchConfig } from '@webkurier/websearch-core';
import type {
  SecurityCheckConfig,
  SecurityCheckResult,
  SecurityMode,
  SecuritySource,
} from './types/SecurityCheck';
import { UrlSanitizer } from './services/UrlSanitizer';
import { RiskCalculator } from './services/RiskCalculator';
import type { CacheManager } from './services/CacheManager';
import { RedisCacheManager } from './services/RedisCacheManager';

type AdapterDeps = {
  cache?: CacheManager;
  webSearchClient?: WebSearchClient;
};

export class SecuritySearchAdapter {
  private readonly cache?: CacheManager;
  private readonly webSearchClient: WebSearchClient;

  constructor(deps: AdapterDeps = {}) {
    this.cache = deps.cache ?? createDefaultCacheManager();

    this.webSearchClient =
      deps.webSearchClient ??
      new WebSearchClient({
        apiKey: process.env.OPENAI_API_KEY ?? '',
        baseURL: process.env.OPENAI_BASE_URL,
      });
  }

  async check(
    target: string,
    config: SecurityCheckConfig = {},
  ): Promise<SecurityCheckResult> {
    const startedAt = Date.now();
    const mode = config.mode ?? 'fast';

    const sanitized = UrlSanitizer.sanitize(target);
    const cacheKey = this.buildCacheKey(sanitized.normalizedTarget);

    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cache: 'hit',
        },
      };
    }

    const query = buildSecurityPrompt(sanitized.normalizedTarget, mode);

    // ✅ Типизированный конфиг вместо as any
    const searchConfig: SearchConfig = {
      mode: mode === 'agentic' ? SearchMode.AGENTIC : SearchMode.FAST,
      includeSources: true,
      timeoutMs: mode === 'agentic' ? 45000 : 12000,
    };

    const response = await this.webSearchClient.search(query, searchConfig);

    const result = RiskCalculator.calculate({
      target,
      normalizedTarget: sanitized.normalizedTarget,
      mode,
      text: String(response?.text ?? ''),
      sources: mapSources(response?.citations),
      model: response?.metadata?.model,
      tokensUsed: response?.metadata?.tokensUsed,
      searchQueries: response?.metadata?.searchQueries ?? [
        buildHumanReadableQuery(sanitized.normalizedTarget),
      ],
      durationMs: Date.now() - startedAt,
    });

    const ttlSeconds = Number(process.env.SECURITY_CACHE_TTL ?? 3600);
    await this.cache?.set(cacheKey, result, ttlSeconds);

    return result;
  }

  private buildCacheKey(target: string): string {
    const hash = crypto.createHash('sha256').update(target).digest('hex');
    return `sec:${hash}`;
  }
}

function createDefaultCacheManager(): CacheManager | undefined {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return undefined;
  try {
    return new RedisCacheManager(redisUrl);
  } catch {
    return undefined;
  }
}

function mapSources(input: unknown): SecuritySource[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item: unknown) => ({
      // ✅ item: unknown вместо any
      title: String((item as Record<string, unknown>)?.title ?? 'Untitled source'),
      url: String((item as Record<string, unknown>)?.url ?? ''),
    }))
    .filter((item) => item.url);
}

function buildSecurityPrompt(target: string, mode: SecurityMode): string {
  if (mode === 'agentic') {
    return [
      `Perform a security reputation analysis for the target: ${target}.`,
      'Check for phishing, malware, scam, blacklist, abuse, WHOIS age, and domain reputation signals.',
      'Prefer trusted sources such as VirusTotal, URLScan, Google Safe Browsing, WHOIS, security vendors, or official threat intelligence sources.',
      'Return a concise verdict with supporting evidence.',
    ].join(' ');
  }
  return [
    `Quick security reputation check for: ${target}.`,
    'Look for phishing, malware, blacklist, abuse, and reputation indicators.',
    'Prefer trusted sources and return a short verdict.',
  ].join(' ');
}

function buildHumanReadableQuery(target: string): string {
  return `security reputation for ${target}`;
}


