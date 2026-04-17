import { WebSearchClient, SearchResponse } from '../WebSearchClient';
import { SearchMode } from '../types/SearchMode';
import { SearchConfig } from '../types/SearchConfig';
import { WebSearchError } from '../errors';

/**
 * Стратегия выбора режима поиска на основе анализа запроса
 */
export interface SearchStrategy {
  /**
   * Анализ запроса и выбор оптимального режима
   * @returns рекомендуемый SearchMode + override конфигурации
   */
  analyze(query: string, context?: any): {
    mode: SearchMode;
    configOverrides?: Partial<SearchConfig>;
    reason: string;
  };
}

/**
 * Базовый оркестратор поиска с автоматическим выбором стратегии
 */
export class SearchOrchestrator {
  constructor(
    private readonly client: WebSearchClient,
    private readonly strategy?: SearchStrategy
  ) {}

  /**
   * Умный поиск с авто-выбором режима
   */
  async smartSearch(
    query: string,
    context?: {
      userRole?: 'end-user' | 'analyst' | 'engineer';
      urgency?: 'low' | 'medium' | 'high';
      domain?: string; // Предпочтительный домен для фильтрации
    }
  ): Promise<SearchResponse> {
    // 1. Анализ запроса через стратегию или эвристики
    const analysis = this.strategy?.analyze(query, context) ?? this.heuristicAnalysis(query, context);
    
    // 2. Применение domain filter если указан контекст
    const configOverrides: Partial<SearchConfig> = {
      ...analysis.configOverrides,
    };

    if (context?.domain) {
      configOverrides.domainFilters = {
        allowedDomains: [context.domain],
      };
    }

    // 3. Логирование выбора режима (для observability)
    console.debug('[SearchOrchestrator]', {
      query: query.slice(0, 100),
      selectedMode: analysis.mode,
      reason: analysis.reason,
      context,
    });

    // 4. Выполнение поиска
    return this.client.search(query, {
      mode: analysis.mode,
      ...configOverrides,
    });
  }

  /**
   * Эвристический анализ запроса (fallback если нет стратегии)
   */
  private heuristicAnalysis(
    query: string,
    context?: any
  ): { mode: SearchMode; configOverrides?: Partial<SearchConfig>; reason: string } {
    const q = query.toLowerCase();

    // Deep Research триггеры
    if (
      /research|analysis|compare.*comprehensive|market.*report|technical.*deep/i.test(q) ||
      context?.userRole === 'analyst'
    ) {
      return {
        mode: SearchMode.DEEP,
        reason: 'Complex analytical query detected',
      };
    }

    // Agentic Search триггеры
    if (
      /compare|versus|best.*for|pros.*cons|how.*work|explain.*in.*detail/i.test(q) ||
      /\?/.test(query) && query.split(' ').length > 10
    ) {
      return {
        mode: SearchMode.AGENTIC,
        reason: 'Multi-faceted question requiring reasoning',
      };
    }

    // Fast Search по умолчанию
    return {
      mode: SearchMode.FAST,
      reason: 'Simple factual query',
      configOverrides: { timeoutMs: 8000 },
    };
  }

  /**
   * Регистрация кастомной стратегии
   */
  setStrategy(strategy: SearchStrategy): this {
    // @ts-expect-error readonly для паттерна immutable config
    this.strategy = strategy;
    return this;
  }
}

