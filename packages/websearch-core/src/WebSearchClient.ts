import OpenAI from 'openai';
import { SearchMode, SEARCH_MODE_CONFIG } from './types/SearchMode.js';
import type {
  SearchConfig,
  UserLocation,
} from './types/SearchConfig.js';
import { validateSearchConfig } from './types/SearchConfig.js';
import {
  WebSearchError,
  SearchTimeoutError,
  RateLimitError,
} from './errors.js';

/**
 * Результат поиска с метаданными
 */
export interface SearchResponse {
  text: string;
  citations: Array<{
    url: string;
    title: string;
    startIndex: number;
    endIndex: number;
  }>;
  sources?: Array<{
    url: string;
    type: 'web' | 'oai-sports' | 'oai-weather' | 'oai-finance';
  }>;
  metadata: {
    mode: SearchMode;
    model: string;
    searchQueries?: string[];
    durationMs: number;
    tokensUsed: number;
  };
}

type WebSearchTool = {
  type: 'web_search';
  filters?: { allowed_domains: string[] };
  user_location?: {
    type: 'approximate';
    country: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  external_web_access?: boolean;
};

type ResponseOutputItem = {
  type: string;
  role?: string;
  content?: Array<{
    text: string;
    annotations?: Array<{
      type: string;
      url: string;
      title: string;
      start_index: number;
      end_index: number;
    }>;
  }>;
  query?: string;
  sources?: Array<{ url: string; type?: string }>;
};

export class WebSearchClient {
  private readonly openai: OpenAI;
  private readonly defaultConfig: Partial<SearchConfig>;

  constructor(options: {
    apiKey: string;
    baseURL?: string;
    defaultConfig?: Partial<SearchConfig>;
  }) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      dangerouslyAllowBrowser: false,
    });

    this.defaultConfig = options.defaultConfig ?? {};
  }

  async search(
    query: string,
    overrideConfig?: Partial<SearchConfig>,
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

      const webSearchTool: WebSearchTool = {
        type: 'web_search',
      };

      if (config.domainFilters?.allowedDomains?.length) {
        webSearchTool.filters = {
          allowed_domains: config.domainFilters.allowedDomains,
        };
      }

      if (config.location) {
        webSearchTool.user_location = {
          type: 'approximate',
          country: config.location.country,
          ...(config.location.city && { city: config.location.city }),
          ...(config.location.region && { region: config.location.region }),
          ...(config.location.timezone && { timezone: config.location.timezone }),
        };
      }

      if (config.liveAccess === false) {
        webSearchTool.external_web_access = false;
      }

      const requestBody: Record<string, unknown> = {
        model: modeConfig.model,
        tools: [webSearchTool],
        tool_choice: 'auto',
        input: query,
        max_output_tokens: modeConfig.maxTokens,
      };

      if (modeConfig.reasoningEffort) {
        requestBody['reasoning'] = { effort: modeConfig.reasoningEffort };
      }

      if (config.includeSources || config.mode === SearchMode.DEEP) {
        requestBody['include'] = ['web_search_call.action.sources'];
      }

      if (modeConfig.backgroundMode) {
        requestBody['background'] = true;
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeoutMs ?? 30000,
      );

      let response: { output: ResponseOutputItem[]; usage?: { total_tokens: number } };
      try {
        response = await (this.openai.responses as any).create(requestBody, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const messageItem = response.output.find(
        (item) => item.type === 'message' && item.role === 'assistant',
      );

      if (!messageItem?.content?.[0]) {
        throw new WebSearchError('No message in response', { response });
      }

      const content = messageItem.content[0];
      const citations =
        content.annotations
          ?.filter((ann) => ann.type === 'url_citation')
          .map((ann) => ({
            url: ann.url,
            title: ann.title,
            startIndex: ann.start_index,
            endIndex: ann.end_index,
          })) ?? [];

      let sources: SearchResponse['sources'];
      if (config.includeSources && response.output) {
        const searchCall = response.output.find(
          (item) => item.type === 'web_search_call',
        );
        if (searchCall?.sources) {
          sources = searchCall.sources.map((s) => ({
            url: s.url,
            type: (s.type ?? 'web') as SearchResponse['sources'][number]['type'],
          }));
        }
      }

      const searchQueries = response.output
        .filter((item) => item.type === 'web_search_call' && item.query)
        .map((item) => item.query as string);

      return {
        text: content.text,
        citations,
        sources,
        metadata: {
          mode: config.mode,
          model: modeConfig.model,
          searchQueries: searchQueries.length > 0 ? searchQueries : undefined,
          durationMs: Date.now() - startTime,
          tokensUsed: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new SearchTimeoutError('Search request timed out', {
          query,
          config,
        });
      }

      if (error instanceof OpenAI.RateLimitError) {
        throw new RateLimitError('OpenAI rate limit exceeded', {
          retryAfter: error.headers?.['retry-after'],
        });
      }

      throw new WebSearchError('Search failed', {
        cause: error,
        query,
        config,
      });
    }
  }

  async quickSearch(
    query: string,
    options?: {
      location?: UserLocation;
      allowedDomains?: string[];
    },
  ): Promise<SearchResponse> {
    return this.search(query, {
      mode: SearchMode.FAST,
      location: options?.location,
      domainFilters: options?.allowedDomains
        ? { allowedDomains: options.allowedDomains }
        : undefined,
      timeoutMs: 10000,
    });
  }

  async deepResearch(
    query: string,
    options?: {
      onProgress?: SearchConfig['onProgress'];
      allowedDomains?: string[];
    },
  ): Promise<SearchResponse> {
    return this.search(query, {
      mode: SearchMode.DEEP,
      domainFilters: options?.allowedDomains
        ? { allowedDomains: options.allowedDomains }
        : undefined,
      includeSources: true,
      timeoutMs: 300000,
      onProgress: options?.onProgress,
    });
  }
}
