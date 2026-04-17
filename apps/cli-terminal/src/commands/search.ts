import { Command } from 'commander';
import { WebSearchClient } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';
import { SearchConfig, UserLocation } from '@webkurier/websearch-core/types/SearchConfig';
import ora from 'ora';
import chalk from 'chalk';
import { PromptEngine } from '../lib/interactive/PromptEngine';
import { PrettyFormatter } from '../lib/output/PrettyFormatter';
import { JsonFormatter } from '../lib/output/JsonFormatter';
import { TableFormatter } from '../lib/output/TableFormatter';
import { MarkdownFormatter } from '../lib/output/MarkdownFormatter';
import { CliConfig } from '../lib/config/CliConfig';
import { EXIT_CODES } from '../utils/exitCodes';

export function registerSearchCommand(program: Command) {
  program
    .command('search <query...>')
    .description('🔍 Execute AI-powered web search')
    .argument('<query...>', 'Search query (space-separated)')
    
    // Режим поиска
    .option('-m, --mode <mode>', 'Search mode: fast | agentic | deep', 'fast')
    
    // Геолокация
    .option('-c, --country <code>', 'ISO country code (e.g., DE, US)')
    .option('--city <name>', 'City name for localization')
    .option('--timezone <tz>', 'IANA timezone (e.g., Europe/Berlin)')
    
    // Фильтрация доменов
    .option('-d, --domain <domains...>', 'Restrict search to specific domains')
    
    // Вывод
    .option('-f, --format <format>', 'Output format: pretty | json | table | md', 'pretty')
    .option('--no-citations', 'Hide inline citations in output')
    .option('--sources', 'Include full sources list in output')
    
    // Поведение
    .option('-i, --interactive', 'Enable interactive mode (prompts for missing config)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('--dry-run', 'Show request config without executing', false)
    
    .action(async (queryParts: string[], options: any) => {
      try {
        const query = queryParts.join(' ');
        
        // 1. Загрузка и слияние конфигурации
        const config = await CliConfig.resolve({
          cliOptions: options,
          query,
        });

        // 2. Интерактивный режим: запрос недостающих параметров
        if (options.interactive) {
          const enhanced = await PromptEngine.enrichConfig(config);
          Object.assign(config, enhanced);
        }

        // 3. Dry-run: показать что будет отправлено
        if (options.dryRun) {
          PrettyFormatter.printDryRun(query, config);
          process.exit(EXIT_CODES.SUCCESS);
        }

        // 4. Инициализация клиента
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error(chalk.red('❌ OPENAI_API_KEY not found'));
          console.log('💡 Run: webkurier config set OPENAI_API_KEY=sk-...');
          process.exit(EXIT_CODES.CONFIG_ERROR);
        }

        const client = new WebSearchClient({
          apiKey,
          baseURL: process.env.OPENAI_BASE_URL,
          defaultConfig: {
            location: config.location,
            domainFilters: config.domainFilters,
            liveAccess: config.liveAccess,
          },
        });

        // 5. Индикатор загрузки (кроме JSON вывода)
        const showSpinner = options.format !== 'json';
        const spinner = showSpinner ? ora({
          text: `🔍 Searching: ${chalk.cyan(query.slice(0, 60))}${query.length > 60 ? '...' : ''}`,
          color: 'cyan',
        }).start() : null;

        // 6. Выполнение поиска
        const searchConfig: Partial<SearchConfig> = {
          mode: config.mode,
          location: config.location,
          domainFilters: config.domainFilters,
          liveAccess: config.liveAccess,
          includeSources: options.sources,
          timeoutMs: parseInt(options.timeout, 10),
        };

        const startTime = Date.now();
        const result = await client.search(query, searchConfig);
        const duration = Date.now() - startTime;

        if (spinner) spinner.succeed(`Done in ${duration}ms`);

        // 7. Форматирование и вывод
        const outputConfig = {
          showCitations: options.citations !== false,
          showMetadata: options.format === 'json' || options.format === 'table',
          color: options.color,
        };

        let output: string;
        switch (options.format) {
          case 'json':
            output = JsonFormatter.format(result, outputConfig);
            break;
          case 'table':
            output = TableFormatter.format(result, outputConfig);
            break;
          case 'md':
            output = MarkdownFormatter.format(result, outputConfig);
            break;
          default:
            output = PrettyFormatter.format(result, { ...outputConfig, query, duration });
        }

        console.log(output);

        // 8. Exit code на основе результата
        if (result.metadata.mode === SearchMode.DEEP && duration > 120000) {
          console.log(chalk.yellow('⚠️  Deep research took >2min — consider caching for production'));
        }

        process.exit(EXIT_CODES.SUCCESS);

      } catch (error: any) {
        // Централизованная обработка ошибок
        if (error.code === 'invalid_api_key') {
          console.error(chalk.red('❌ Invalid OpenAI API key'));
          console.log('💡 Check: webkurier config show');
          process.exit(EXIT_CODES.AUTH_ERROR);
        }
        
        if (error.code === 'rate_limit_exceeded') {
          console.error(chalk.red('❌ Rate limit exceeded'));
          const retry = error.retryAfter ?? 60;
          console.log(`💡 Retry after ${retry}s or upgrade your OpenAI tier`);
          process.exit(EXIT_CODES.RATE_LIMIT);
        }

        if (error.name === 'ZodError') {
          console.error(chalk.red('❌ Configuration validation failed:'));
          error.errors.forEach((e: any) => {
            console.error(`  • ${e.path.join('.')}: ${e.message}`);
          });
          process.exit(EXIT_CODES.CONFIG_ERROR);
        }

        // Fallback
        console.error(chalk.red('💥 Search failed:'), error.message);
        if (program.opts().debug) {
          console.error(error);
        }
        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

