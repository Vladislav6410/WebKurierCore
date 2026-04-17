import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';
import { SearchConfig, UserLocation, DomainFilters } from '@webkurier/websearch-core/types/SearchConfig';

export interface CliResolvedConfig {
  mode: SearchMode;
  location?: UserLocation;
  domainFilters?: DomainFilters;
  liveAccess: boolean;
  timeoutMs: number;
}

export class CliConfig {
  /**
   * Слияние: .env → CLI flags → defaults
   * Приоритет: CLI flags > env vars > hardcoded defaults
   */
  static async resolve(options: {
    cliOptions: any;
    query: string;
  }): Promise<CliResolvedConfig> {
    const { cliOptions, query } = options;

    // 1. Mode resolution
    const mode = this.resolveMode(cliOptions.mode);

    // 2. Location resolution
    const location = this.resolveLocation(cliOptions);

    // 3. Domain filters resolution
    const domainFilters = cliOptions.domain?.length 
      ? { allowedDomains: cliOptions.domain } as DomainFilters
      : this.resolveDomainFiltersFromEnv();

    // 4. Live access
    const liveAccess = cliOptions.liveAccess !== false; // default true

    // 5. Timeout
    const timeoutMs = parseInt(cliOptions.timeout, 10) || 30000;

    // 6. Auto-upgrade для сложных запросов (эвристика)
    const finalMode = this.autoUpgradeMode(mode, query);

    return {
      mode: finalMode,
      location,
      domainFilters,
      liveAccess,
      timeoutMs,
    };
  }

  private static resolveMode(input: string): SearchMode {
    const validModes = Object.values(SearchMode);
    if (validModes.includes(input as SearchMode)) {
      return input as SearchMode;
    }
    console.warn(`⚠️  Invalid mode "${input}", defaulting to ${SearchMode.FAST}`);
    return SearchMode.FAST;
  }

  private static resolveLocation(cli: any): UserLocation | undefined {
    const country = cli.country || process.env.DEFAULT_LOCATION_COUNTRY;
    if (!country) return undefined;

    return {
      country: country.toUpperCase(),
      city: cli.city || process.env.DEFAULT_LOCATION_CITY,
      region: cli.region || process.env.DEFAULT_LOCATION_REGION,
      timezone: cli.timezone || process.env.DEFAULT_LOCATION_TIMEZONE,
    };
  }

  private static resolveDomainFiltersFromEnv(): DomainFilters | undefined {
    const domains = process.env.SEARCH_ALLOWED_DOMAINS;
    if (!domains) return undefined;
    
    return {
      allowedDomains: domains.split(',').map(d => d.trim()).filter(Boolean),
    };
  }

  /**
   * Эвристика: авто-апгрейд режима для сложных запросов
   * (можно отключить через CLI flag --no-auto-upgrade)
   */
  private static autoUpgradeMode(mode: SearchMode, query: string): SearchMode {
    if (mode !== SearchMode.FAST) return mode; // Не downgrade

    const complexKeywords = [
      'compare', 'versus', 'vs', 'analysis', 'research', 
      'deep dive', 'comprehensive', 'market report', 'technical'
    ];

    if (complexKeywords.some(k => query.toLowerCase().includes(k))) {
      console.log(chalk.dim('🧠 Auto-upgraded to AGENTIC mode for complex query'));
      return SearchMode.AGENTIC;
    }

    return mode;
  }
}

