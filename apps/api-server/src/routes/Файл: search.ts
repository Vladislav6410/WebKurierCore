import { Router, Request, Response } from 'express';
import { WebSearchClient } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';
import { validateSearchConfig } from '@webkurier/websearch-core/types/SearchConfig';
import { z } from 'zod';

const router = Router();

// Валидация входных данных
const SearchRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  mode: z.nativeEnum(SearchMode).optional().default(SearchMode.FAST),
  location: z.object({
    country: z.string().length(2),
    city: z.string().optional(),
    region: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  domainFilters: z.object({
    allowedDomains: z.array(z.string()).max(100).optional(),
    excludedDomains: z.array(z.string()).optional(),
  }).optional(),
  liveAccess: z.boolean().optional(),
  includeSources: z.boolean().optional(),
});

export function createSearchRoute(searchClient: WebSearchClient) {
  /**
   * POST /api/v1/search
   * 
   * Выполняет веб-поиск через OpenAI Responses API
   * 
   * Request:
   * {
   *   "query": "string",
   *   "mode": "fast" | "agentic" | "deep",
   *   "location": { "country": "DE", "city": "Berlin" },
   *   "domainFilters": { "allowedDomains": ["openai.com"] },
   *   "liveAccess": true,
   *   "includeSources": false
   * }
   * 
   * Response:
   * {
   *   "text": "string",
   *   "citations": [{ "url": "string", "title": "string", "startIndex": number, "endIndex": number }],
   *   "sources": [{ "url": "string", "type": "web" }],
   *   "metadata": { "mode": "fast", "model": "gpt-5-mini", "durationMs": 1234, "tokensUsed": 456 }
   * }
   */
  router.post('/api/v1/search', async (req: Request, res: Response) => {
    try {
      // 1. Валидация запроса
      const validated = SearchRequestSchema.parse(req.body);
      
      // 2. Подготовка конфигурации
      validateSearchConfig(validated);

      // 3. Выполнение поиска
      const result = await searchClient.search(validated.query, {
        mode: validated.mode,
        location: validated.location,
        domainFilters: validated.domainFilters,
        liveAccess: validated.liveAccess,
        includeSources: validated.includeSources,
        timeoutMs: validated.mode === SearchMode.DEEP ? 300000 : 30000,
      });

      // 4. Ответ клиенту
      res.json({
        success: true,
         result,
      });

    } catch (error) {
      console.error('[POST /api/v1/search] Error:', error);

      // Обработка известных ошибок
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'validation_failed',
          details: error.errors,
        });
      }

      if (error?.code === 'rate_limit_exceeded') {
        return res.status(429).json({
          success: false,
          error: 'rate_limit',
          retryAfter: error.headers?.['retry-after'] ?? 60,
        });
      }

      res.status(500).json({
        success: false,
        error: 'search_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

