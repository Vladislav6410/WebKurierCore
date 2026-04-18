/**
 * Базовая ошибка веб-поиска
 */
export class WebSearchError extends Error {
  readonly context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'WebSearchError';
    this.context = context;
  }
}

/**
 * Ошибка таймаута запроса
 */
export class SearchTimeoutError extends WebSearchError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context);
    this.name = 'SearchTimeoutError';
  }
}

/**
 * Ошибка превышения лимита запросов
 */
export class RateLimitError extends WebSearchError {
  readonly retryAfter?: string;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context);
    this.name = 'RateLimitError';
    this.retryAfter = context['retryAfter'] as string | undefined;
  }
}
