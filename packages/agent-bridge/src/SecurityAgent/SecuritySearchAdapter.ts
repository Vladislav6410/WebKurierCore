import crypto from 'node:crypto';

import { WebSearchClient } from '@webkurier/websearch-core';
import { UrlSanitizer } from './services/UrlSanitizer';

export type SecurityMode = 'fast' | 'agentic';
export type SecurityVerdict = 'safe' | 'suspicious' | 'malicious' | 'unknown';

export interface SecurityCheckConfig {
  mode?: SecurityMode;
}

export interface SecuritySource {
  title: string;
  url: string;
}

export interface SecurityCheckResult {
  target: string;
  normalizedTarget: string;
  verdict: SecurityVerdict;
  riskScore: number;
  findings: string[];
  recommendations: string[];
  sources: SecuritySource[];
  metadata: {
    mode: SecurityMode;
    model: string;
    durationMs: number;
    tokensUsed?: number;
    searchQueries?: string[];
    cache?: 'hit' | 'miss';
    checkedAt: string;
  };
}

type CacheLike = {
  get(key: string): Promise<SecurityCheckResult | null> | SecurityCheckResult | null;
  set(
    key: string,
    value: SecurityCheckResult,
    ttlSeconds: number,
  ): Promise<void> | void;
};

type AdapterDeps = {
  cache?: CacheLike;
  webSearchClient?: WebSearchClient;
};

export class SecuritySearchAdapter {
  private readonly cache?: CacheLike;
  private readonly webSearchClient: WebSearchClient;

  constructor(deps: AdapterDeps = {}) {
    this.cache = deps.cache;
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
    const response = await this.webSearchClient.search(query, {
      mode,
      includeSources: true,
      timeoutMs: mode === 'agentic' ? 45000 : 12000,
    } as any);

    const result = this.mapWebSearchToSecurityResult(
      sanitized.normalizedTarget,
      mode,
      response,
      Date.now() - startedAt,
    );

    const ttlSeconds = Number(process.env.SECURITY_CACHE_TTL ?? 3600);
    await this.cache?.set(cacheKey, result, ttlSeconds);

    return result;
  }

  private mapWebSearchToSecurityResult(
    normalizedTarget: string,
    mode: SecurityMode,
    response: any,
    durationMs: number,
  ): SecurityCheckResult {
    const text = String(response?.text ?? '');

    const findings: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    const hasMalicious = /(malicious|phishing|malware|scam|fraud|blacklist)/i.test(text);
    const hasSuspicious = /(suspicious|unverified|low reputation|recently registered|abuse)/i.test(text);
    const hasSafeSignals = /(safe|trusted|benign|no known malicious activity)/i.test(text);

    if (hasMalicious) {
      riskScore += 80;
      findings.push('Multiple threat indicators were found in external reports');
      recommendations.push('Do not open or share this link');
      recommendations.push('Escalate for manual security review');
    } else if (hasSuspicious) {
      riskScore += 45;
      findings.push('Some threat indicators or reputation concerns were detected');
      recommendations.push('Use caution and verify the target manually');
    } else if (hasSafeSignals) {
      findings.push('No strong threat indicators were found in the reviewed sources');
      recommendations.push('Continue to monitor if this target is business-critical');
    } else {
      riskScore += 15;
      findings.push('Insufficient evidence for a strong verdict');
      recommendations.push('Collect additional intelligence before trusting the target');
    }

    const verdict = resolveVerdict(riskScore);

    return {
      target: normalizedTarget,
      normalizedTarget,
      verdict,
      riskScore,
      findings,
      recommendations,
      sources: mapSources(response?.citations),
      metadata: {
        mode,
        model: response?.metadata?.model ?? 'unknown',
        durationMs,
        tokensUsed: response?.metadata?.tokensUsed,
        searchQueries: response?.metadata?.searchQueries ?? [buildHumanReadableQuery(normalizedTarget)],
        cache: 'miss',
        checkedAt: new Date().toISOString(),
      },
    };
  }

  private buildCacheKey(target: string): string {
    const hash = crypto.createHash('sha256').update(target).digest('hex');
    return `sec:${hash}`;
  }
}

function resolveVerdict(riskScore: number): SecurityVerdict {
  const blockThreshold = Number(process.env.SECURITY_BLOCK_THRESHOLD ?? 75);

  if (riskScore >= blockThreshold) {
    return 'malicious';
  }

  if (riskScore >= 40) {
    return 'suspicious';
  }

  if (riskScore > 0) {
    return 'unknown';
  }

  return 'safe';
}

function mapSources(input: unknown): SecuritySource[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item: any) => ({
      title: String(item?.title ?? 'Untitled source'),
      url: String(item?.url ?? ''),
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