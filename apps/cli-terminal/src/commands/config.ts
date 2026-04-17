import chalk from 'chalk';
import { Command } from 'commander';
import { EXIT_CODES } from '../utils/exitCodes';

const SAFE_ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'DEFAULT_LOCATION_COUNTRY',
  'DEFAULT_LOCATION_CITY',
  'DEFAULT_LOCATION_REGION',
  'DEFAULT_LOCATION_TIMEZONE',
  'SEARCH_ALLOWED_DOMAINS',
] as const;

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Manage CLI configuration');

  config
    .command('show')
    .description('Show resolved environment configuration')
    .action(() => {
      console.log(chalk.bold.cyan('\n⚙️ WebKurier Config'));
      console.log(chalk.gray('─'.repeat(60)));

      for (const key of SAFE_ENV_KEYS) {
        const raw = process.env[key];
        const value = maskIfNeeded(key, raw);
        console.log(`${chalk.bold(key)}=${value ?? chalk.gray('(not set)')}`);
      }

      console.log('');
      process.exit(EXIT_CODES.SUCCESS);
    });

  config
    .command('get <key>')
    .description('Get a single config value from environment')
    .action((key: string) => {
      const value = process.env[key];

      if (value === undefined) {
        console.error(chalk.red(`❌ "${key}" is not set`));
        process.exit(EXIT_CODES.CONFIG_ERROR);
      }

      console.log(maskIfNeeded(key, value));
      process.exit(EXIT_CODES.SUCCESS);
    });
}

function maskIfNeeded(key: string, value?: string): string | undefined {
  if (!value) {
    return value;
  }

  if (key === 'OPENAI_API_KEY') {
    if (value.length <= 10) {
      return '***';
    }

    return `${value.slice(0, 6)}***${value.slice(-4)}`;
  }

  return value;
}
