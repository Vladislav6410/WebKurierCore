/**
 * Режимы поиска OpenAI Web Search API
 * @see https://developers.openai.com/api/docs/guides/tools-web-search
 */
export enum SearchMode {
  /**
   * FAST: Non-reasoning search
   * - Прямой запрос → топ-результаты → ответ
   * - Латентность: <2с, стоимость: низкая
   * - Use case: цены, факты, простые запросы
   */
  FAST = 'fast',

  /**
   * AGENTIC: Reasoning-based search
   * - Модель планирует запросы, анализирует, итеративно уточняет
   * - Латентность: 5-30с, стоимость: средняя
   * - Use case: сравнения, анализ, сложные вопросы
   */
  AGENTIC = 'agentic',

  /**
   * DEEP: Deep Research mode
   * - Многошаговое исследование, 10-100+ источников
   * - Латентность: 1-5 мин, стоимость: высокая
   * - Use case: бизнес-анализ, технические исследования
   */
  DEEP = 'deep',
}

export type SearchModeConfig = {
  model: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  maxTokens: number;
  backgroundMode: boolean;
};

export const SEARCH_MODE_CONFIG: Record<SearchMode, SearchModeConfig> = {
  [SearchMode.FAST]: {
    model: 'gpt-5-mini',
    maxTokens: 4096,
    backgroundMode: false,
  },
  [SearchMode.AGENTIC]: {
    model: 'gpt-5',
    reasoningEffort: 'medium',
    maxTokens: 16384,
    backgroundMode: false,
  },
  [SearchMode.DEEP]: {
    model: 'o3-deep-research',
    reasoningEffort: 'high',
    maxTokens: 128000,
    backgroundMode: true,
  },
};

