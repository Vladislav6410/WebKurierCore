import { WebSearchClient, SearchResponse } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core';

export class SecuritySearchAdapter {
  constructor(private readonly searchClient: WebSearchClient) {}

  async checkUrlSafety(url: string): Promise<{
    isSafe: boolean;
    riskScore: number;
    findings: Array<{
      source: string;
      verdict: 'safe' | 'suspicious' | 'malicious';
      summary: string;
      url: string;
    }>;
    rawSearch: SearchResponse;
  }> {
    const trustedDomains = [
      'virustotal.com',
      'urlscan.io',
      'google.com',
      'phishtank.com',
      'whois.domaintools.com',
      'reputation.alienvault.com',
    ];

    const query = `security reputation analysis for URL: ${url} phishing malware blacklist`;

    const result = await this.searchClient.search(query, {
      mode: SearchMode.AGENTIC,
      domainFilters: { allowedDomains: trustedDomains },
      includeSources: true,
      timeoutMs: 25000,
    });

    const findings = result.citations.map((citation) => {
      const isSecurityDomain = trustedDomains.some((d) =>
        citation.url.includes(d),
      );
      return {
        source: new URL(citation.url).hostname,
        verdict: isSecurityDomain
          ? this.inferVerdict(citation.title)
          : ('suspicious' as const),
        summary: citation.title,
        url: citation.url,
      };
    });

    const maliciousCount = findings.filter(
      (f) => f.verdict === 'malicious',
    ).length;
    const suspiciousCount = findings.filter(
      (f) => f.verdict === 'suspicious',
    ).length;

    const riskScore = Math.min(
      100,
      maliciousCount * 40 + suspiciousCount * 15,
    );

    return {
      isSafe: riskScore < 25,
      riskScore,
      findings,
      rawSearch: result,
    };
  }

  async monitorBrandMentions(
    brand: string,
    options: {
      timeWindow?: '24h' | '7d' | '30d';
      sentiment?: 'negative' | 'neutral' | 'positive';
      sources?: string[];
    } = {},
  ): Promise<
    Array<{
      title: string;
      url: string;
      publishedDate?: string;
      sentiment: 'negative' | 'neutral' | 'positive';
      source: string;
    }>
  > {
    const timeFilter =
      options.timeWindow === '24h'
        ? 'today'
        : options.timeWindow === '7d'
          ? 'this week'
          : 'this month';

    const sentimentFilter = options.sentiment
      ? `${options.sentiment} sentiment`
      : '';

    const query = `${brand} ${sentimentFilter} news ${timeFilter} review complaint`;

    const domainFilter = options.sources?.length
      ? { allowedDomains: options.sources }
      : undefined;

    const result = await this.searchClient.search(query, {
      mode: SearchMode.AGENTIC,
      domainFilters: domainFilter,
      location: { country: 'DE' },
      timeoutMs: 20000,
    });

    return result.citations.map((c) => {
      const titleLower = c.title.toLowerCase();
      const negativeKeywords = ['scam', 'fraud', 'complaint', 'warning', 'issue'];
      const positiveKeywords = ['recommended', 'excellent', 'trusted', 'award'];

      const sentiment = negativeKeywords.some((k) => titleLower.includes(k))
        ? ('negative' as const)
        : positiveKeywords.some((k) => titleLower.includes(k))
          ? ('positive' as const)
          : ('neutral' as const);

      return {
        title: c.title,
        url: c.url,
        sentiment,
        source: new URL(c.url).hostname,
      };
    });
  }

  private inferVerdict(title: string): 'safe' | 'suspicious' | 'malicious' {
    if (/malicious|phishing|malware|blacklist|blocked/i.test(title))
      return 'malicious';
    if (/suspicious|caution|unverified|risk/i.test(title)) return 'suspicious';
    return 'safe';
  }
}

