import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { WebSearchClient } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';
import { SearchConfig } from '@webkurier/websearch-core/types/SearchConfig';

import { CliConfig } from '../lib/config/CliConfig';
import { PromptEngine } from '../lib/interactive/PromptEngine';
import { JsonFormatter } from '../lib/output/JsonFormatter';
import { MarkdownFormatter } from '../lib/output/MarkdownFormatter';
import { PrettyFormatter } from '../lib/output/PrettyFormatter';
import { TableFormatter } from '../lib/output/TableFormatter';
import { EXIT_CODES } from '../utils/exitCodes';

type SearchCommandOptions = {
  mode?: string;
  country?: string;
  city?: string;
  timezone?: string;
  domain?: string[];
  format?: 'pretty' | 'json' | 'table' | 'md' | 'markdown';
  citations?: boolean;
  sources?: boolean;
  interactive?: boolean;
  timeout?: string;
  dryRun?: boolean;
  live?: boolean;
};

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('🔍 Execute AI-powered web search')
    .argument('<query...>', 'Search query (space-separated)')
    .option('-m, --mode <mode>', 'Search mode: fast | agentic | deep', 'fast')
    .option('-c, --country <code>', 'ISO country code (e.g., DE, US)')
    .option('--city <name>', 'City name for localization')
    .option('--timezone <tz>', 'IANA timezone (e.g., Europe/Berlin)')
    .option('-d, --domain <domains...>', 'Restrict search to specific domains')
    .option('-f, --format <format>', 'Output format: pretty | json | table | md', 'pretty')
    .option('--no-citations', 'Hide inline citations in output')
    .option('--sources', 'Include full sources list in output')
    .option('-i, --interactive', 'Enable interactive mode')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('--dry-run', 'Show request config without executing', false)
    .option('--no-live', 'Disable live web access and use cached/default behavior only')
    .action(async (queryParts: string[], options: SearchCommandOptions) => {
      const rootOptions = program.opts<{ debug: boolean; color: boolean }>();

      try {
        const query = queryParts.join(' ').trim();

        if (!query) {
          console.error(chalk.red('❌ Query is required'));
          process.exit(EXIT_CODES.CONFIG_ERROR);
        }

        const config = await CliConfig.resolve({
          cliOptions: options,
          query,
        });

        if (options.interactive) {
          const enhanced = await PromptEngine.enrichConfig(config);
          Object.assign(config, enhanced);
        }

        if (options.dryRun) {
          const normalizedFormat = normalizeFormat(options.format);
          if (normalizedFormat === 'json') {
            console.log(
              JSON.stringify(
                {
                  query,
                  config,
                },
                null,
                2,
              ),
            );
          } else {
            PrettyFormatter.printDryRun(query, config, rootOptions.color);
          }

          process.exit(EXIT_CODES.SUCCESS);
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error(chalk.red('❌ OPENAI_API_KEY not found'));
          console.log('💡 Create a .env file or export OPENAI_API_KEY before running the CLI');
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

        const normalizedFormat = normalizeFormat(options.format);
        const showSpinner = normalizedFormat !== 'json';

        const spinner = showSpinner
          ? ora({
              text: `🔍 Searching: ${query.slice(0, 60)}${query.length > 60 ? '...' : ''}`,
              color: 'cyan',
            }).start()
          : null;

        const searchConfig: Partial<SearchConfig> = {
          mode: config.mode,
          location: config.location,
          domainFilters: config.domainFilters,
          liveAccess: config.liveAccess,
          includeSources: options.sources === true,
          timeoutMs: config.timeoutMs,
        };

        const startTime = Date.now();
        const result = await client.search(query, searchConfig);
        const duration = Date.now() - startTime;

        if (spinner) {
          spinner.succeed(`Done in ${duration}ms`);
        }

        const outputConfig = {
          showCitations: options.citations !== false,
          showMetadata: normalizedFormat === 'json' || normalizedFormat === 'table',
          color: rootOptions.color,
          query,
          duration,
        };

        let output: string;

        switch (normalizedFormat) {
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
            output = PrettyFormatter.format(result, outputConfig);
            break;
        }

        console.log(output);

        if (result.metadata?.mode === SearchMode.DEEP && duration > 120000) {
          console.log(
            chalk.yellow('⚠️ Deep research took more than 2 minutes — consider caching for production use'),
          );
        }

        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: any) {
        if (error?.code === 'invalid_api_key') {
          console.error(chalk.red('❌ Invalid OpenAI API key'));
          process.exit(EXIT_CODES.AUTH_ERROR);
        }

        if (error?.code === 'rate_limit_exceeded') {
          console.error(chalk.red('❌ Rate limit exceeded'));
          const retry = error.retryAfter ?? 60;
          console.log(`💡 Retry after ${retry}s or upgrade your OpenAI tier`);
          process.exit(EXIT_CODES.RATE_LIMIT);
        }

        if (error?.name === 'ZodError' && Array.isArray(error.errors)) {
          console.error(chalk.red('❌ Configuration validation failed:'));
          for (const item of error.errors) {
            console.error(`  • ${item.path.join('.')}: ${item.message}`);
          }
          process.exit(EXIT_CODES.CONFIG_ERROR);
        }

        console.error(chalk.red('💥 Search failed:'), error?.message ?? 'Unknown error');

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

function normalizeFormat(format?: string): 'pretty' | 'json' | 'table' | 'md' {
  if (format === 'markdown') return 'md';
  if (format === 'json' || format === 'table' || format === 'md') return format;
  return 'pretty';
}

