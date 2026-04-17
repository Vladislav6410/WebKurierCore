import chalk from 'chalk';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';
import {
  DomainFilters,
  UserLocation,
} from '@webkurier/websearch-core/types/SearchConfig';

export interface CliResolvedConfig {
  mode: SearchMode;
  location?: UserLocation;
  domainFilters?: DomainFilters;
  liveAccess: boolean;
  timeoutMs: number;
}

export class CliConfig {
  /**
   * Merge order:
   * CLI flags > environment variables > hardcoded defaults
   */
  static async resolve(options: {
    cliOptions: any;
    query: string;
  }): Promise<CliResolvedConfig> {
    const { cliOptions, query } = options;

    const mode = this.resolveMode(cliOptions.mode);
    const location = this.resolveLocation(cliOptions);
    const domainFilters = cliOptions.domain?.length
      ? { allowedDomains: cliOptions.domain } as DomainFilters
      : this.resolveDomainFiltersFromEnv();

    const liveAccess = cliOptions.live !== false;
    const timeoutMs = this.resolveTimeout(cliOptions.timeout);
    const finalMode = this.autoUpgradeMode(mode, query);

    return {
      mode: finalMode,
      location,
      domainFilters,
      liveAccess,
      timeoutMs,
    };
  }

  private static resolveMode(input?: string): SearchMode {
    const fallback = SearchMode.FAST;

    if (!input) {
      return fallback;
    }

    const normalized = input.toLowerCase();
    const validModes = Object.values(SearchMode);

    if (validModes.includes(normalized as SearchMode)) {
      return normalized as SearchMode;
    }

    console.warn(`⚠️ Invalid mode "${input}", defaulting to ${fallback}`);
    return fallback;
  }

  private static resolveLocation(cli: any): UserLocation | undefined {
    const country = cli.country || process.env.DEFAULT_LOCATION_COUNTRY;
    if (!country) return undefined;

    return {
      country: String(country).toUpperCase(),
      city: cli.city || process.env.DEFAULT_LOCATION_CITY,
      region: cli.region || process.env.DEFAULT_LOCATION_REGION,
      timezone: cli.timezone || process.env.DEFAULT_LOCATION_TIMEZONE,
    };
  }

  private static resolveDomainFiltersFromEnv(): DomainFilters | undefined {
    const domains = process.env.SEARCH_ALLOWED_DOMAINS;
    if (!domains) return undefined;

    const allowedDomains = domains
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^https?:\/\//, '').replace(/\/$/, ''));

    if (!allowedDomains.length) {
      return undefined;
    }

    return { allowedDomains };
  }

  private static resolveTimeout(input?: string): number {
    const parsed = Number.parseInt(String(input ?? '30000'), 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
      return 30000;
    }

    return parsed;
  }

  /**
   * Heuristic auto-upgrade for more complex queries.
   */
  private static autoUpgradeMode(mode: SearchMode, query: string): SearchMode {
    if (mode !== SearchMode.FAST) {
      return mode;
    }

    const normalized = query.toLowerCase();

    const complexKeywords = [
      'compare',
      'versus',
      'vs',
      'analysis',
      'research',
      'deep dive',
      'comprehensive',
      'market report',
      'technical',
      'сравнить',
      'анализ',
      'исследование',
      'глубокий',
      'комплексный',
      'технический',
    ];

    if (complexKeywords.some((keyword) => normalized.includes(keyword))) {
      console.log(chalk.dim('🧠 Auto-upgraded to AGENTIC mode for complex query'));
      return SearchMode.AGENTIC;
    }

    return mode;
  }
}

