import OpenAI from 'openai';
import { SearchMode, SEARCH_MODE_CONFIG } from './types/SearchMode';
import { SearchConfig, validateSearchConfig, UserLocation } from './types/SearchConfig';
import { WebSearchError, SearchTimeoutError, RateLimitError } from './errors';

/**
 * Результат поиска с метаданными
 */
export interface SearchResponse {
  /** Текстовый ответ модели */
  text: string;
  
  /** Inline-цитаты с источниками */
  citations: Array<{
    url: string;
    title: string;
    startIndex: number;
    endIndex: number;
  }>;
  
  /** Полные источники (если includeSources: true) */
  sources?: Array<{
    url: string;
    type: 'web' | 'oai-sports' | 'oai-weather' | 'oai-finance';
  }>;
  
  /** Метаданные выполнения */
  metadata: {
    mode: SearchMode;
    model: string;
    searchQueries?: string[];
    durationMs: number;
    tokensUsed: number;
  };
}

/**
 * Клиент для OpenAI Web Search API через Responses API
 * @see https://developers.openai.com/api/docs/guides/tools-web-search
 */
export class WebSearchClient {
  private readonly openai: OpenAI;
  private readonly defaultConfig: Partial<SearchConfig>;

  constructor(options: {
    apiKey: string;
    baseURL?: string; // Для Azure OpenAI: https://{resource}.openai.azure.com/openai/v1/
    defaultConfig?: Partial<SearchConfig>;
  }) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      dangerouslyAllowBrowser: false, // Только server-side
    });
    this.defaultConfig = options.defaultConfig ?? {};
  }

  /**
   * Выполнение поиска с автоматическим выбором режима
   */
  async search(
    query: string,
    overrideConfig?: Partial<SearchConfig>
  ): Promise<SearchResponse> {
    const config: SearchConfig = {
      mode: SearchMode.FAST,
      ...this.defaultConfig,
      ...overrideConfig,
    };

    validateSearchConfig(config);
    const startTime = Date.now();

    try {
      const modeConfig = SEARCH_MODE_CONFIG[config.mode];
      
      // Формирование tool конфигурации
      const webSearchTool: any = {
        type: 'web_search' as const,
      };

      // Domain filtering (только для Responses API) [[9]]
      if (config.domainFilters?.allowedDomains?.length) {
        webSearchTool.filters = {
          allowed_domains: config.domainFilters.allowedDomains,
        };
      }

      // User location [[9]]
      if (config.location) {
        webSearchTool.user_location = {
          type: 'approximate',
          country: config.location.country,
          ...(config.location.city && { city: config.location.city }),
          ...(config.location.region && { region: config.location.region }),
          ...(config.location.timezone && { timezone: config.location.timezone }),
        };
      }

      // Live access control [[9]]
      if (config.liveAccess === false) {
        webSearchTool.external_web_access = false;
      }

      // Формирование запроса к Responses API
      const requestBody: any = {
        model: modeConfig.model,
        tools: [webSearchTool],
        tool_choice: 'auto' as const,
        input: query,
        max_output_tokens: modeConfig.maxTokens,
      };

      // Reasoning effort для AGENTIC/DEEP режимов
      if (modeConfig.reasoningEffort) {
        requestBody.reasoning = { effort: modeConfig.reasoningEffort };
      }

      // Включение sources для DEEP режима или при явном запросе
      if (config.includeSources || config.mode === SearchMode.DEEP) {
        requestBody.include = ['web_search_call.action.sources'];
      }

      // Background mode для DEEP исследований
      if (modeConfig.backgroundMode) {
        requestBody.background = true;
      }

      // Выполнение запроса с таймаутом
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30000);

      let response;
      try {
        response = await this.openai.responses.create(requestBody, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      // Парсинг ответа
      const messageItem = response.output.find(
        (item: any) => item.type === 'message' && item.role === 'assistant'
      );

      if (!messageItem) {
        throw new WebSearchError('No message in response', { response });
      }

      const content = messageItem.content[0];
      const citations = content.annotations
        ?.filter((ann: any) => ann.type === 'url_citation')
        .map((ann: any) => ({
          url: ann.url,
          title: ann.title,
          startIndex: ann.start_index,
          endIndex: ann.end_index,
        })) ?? [];

      // Извлечение sources если включено
      let sources: SearchResponse['sources'];
      if (config.includeSources && response.output) {
        const searchCall = response.output.find(
          (item: any) => item.type === 'web_search_call'
        );
        if (searchCall?.action?.sources) {
          sources = searchCall.action.sources.map((s: any) => ({
            url: s.url,
            type: s.type ?? 'web',
          }));
        }
      }

      // Извлечение search queries из web_search_call
      const searchQueries = response.output
        ?.filter((item: any) => item.type === 'web_search_call')
        .flatMap((item: any) => item.action?.query ?? [])
        .filter(Boolean) as string[] | undefined;

      return {
        text: content.text,
        citations,
        sources,
        meta {
          mode: config.mode,
          model: modeConfig.model,
          searchQueries,
          durationMs: Date.now() - startTime,
          tokensUsed: response.usage?.total_tokens ?? 0,
        },
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new SearchTimeoutError('Search request timed out', { query, config });
      }
      
      if (error instanceof OpenAI.RateLimitError) {
        throw new RateLimitError('OpenAI rate limit exceeded', { 
          retryAfter: error.headers?.['retry-after'] 
        });
      }

      throw new WebSearchError('Search failed', { 
        cause: error, 
        query, 
        config 
      });
    }
  }

  /**
   * Быстрый поиск (shortcut для FAST mode)
   */
  async quickSearch(query: string, options?: {
    location?: UserLocation;
    allowedDomains?: string[];
  }): Promise<SearchResponse> {
    return this.search(query, {
      mode: SearchMode.FAST,
      location: options?.location,
      domainFilters: options?.allowedDomains ? { allowedDomains: options.allowedDomains } : undefined,
      timeoutMs: 10000,
    });
  }

  /**
   * Глубокое исследование (shortcut для DEEP mode)
   */
  async deepResearch(query: string, options?: {
    onProgress?: SearchConfig['onProgress'];
    allowedDomains?: string[];
  }): Promise<SearchResponse> {
    return this.search(query, {
      mode: SearchMode.DEEP,
      domainFilters: options?.allowedDomains ? { allowedDomains: options.allowedDomains } : undefined,
      includeSources: true,
      timeoutMs: 300000, // 5 минут для deep research
      onProgress: options?.onProgress,
    });
  }
}

