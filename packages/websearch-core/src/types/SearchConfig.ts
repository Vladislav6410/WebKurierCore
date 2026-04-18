import { SearchMode } from './SearchMode.js';

/**
 * Конфигурация пользовательской геолокации
 */
export interface UserLocation {
  /** ISO 3166-1 alpha-2 country code (e.g., "DE", "US") */
  country: string;
  /** City name (free text) */
  city?: string;
  /** Region/state name (free text) */
  region?: string;
  /** IANA timezone (e.g., "Europe/Berlin") */
  timezone?: string;
}

/**
 * Фильтры доменов для ограничения поиска
 */
export interface DomainFilters {
  /** Allow-list доменов (макс. 100). Без http(s):// префикса */
  allowedDomains?: string[];
  /** Deny-list доменов */
  excludedDomains?: string[];
}

/**
 * Основная конфигурация поиска
 */
export interface SearchConfig {
  /** Режим поиска (определяет модель и стратегию) */
  mode: SearchMode;

  /** Пользовательская геолокация для локализации результатов */
  location?: UserLocation;

  /** Фильтрация доменов */
  domainFilters?: DomainFilters;

  /**
   * Контроль доступа к "живому" интернету
   * - true: real-time поиск (default)
   * - false: только кэшированные/индексированные данные
   */
  liveAccess?: boolean;

  /**
   * Включить возврат полных источников
   * @default false
   */
  includeSources?: boolean;

  /** Таймаут запроса в миллисекундах */
  timeoutMs?: number;

  /** Callback для прогресса (для DEEP mode) */
  onProgress?: (params: { step: string; sourcesCount: number }) => void;
}

/**
 * Валидация конфигурации
 */
export function validateSearchConfig(config: SearchConfig): void {
  if (config.domainFilters?.allowedDomains) {
    if (config.domainFilters.allowedDomains.length > 100) {
      throw new Error('allowedDomains limit: 100 URLs maximum');
    }
    for (const domain of config.domainFilters.allowedDomains) {
      if (/^https?:\/\//.test(domain)) {
        throw new Error(`Invalid domain format: "${domain}". Omit http(s):// prefix`);
      }
    }
  }

  if (config.location?.country && !/^[A-Z]{2}$/.test(config.location.country)) {
    throw new Error('Country must be ISO 3166-1 alpha-2 code (e.g., "DE")');
  }

  if (config.mode === SearchMode.DEEP && config.timeoutMs && config.timeoutMs < 60000) {
    console.warn('DEEP mode typically requires >60s timeout');
  }
}

