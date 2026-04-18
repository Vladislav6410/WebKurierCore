import { Command } from 'commander';
import {
  maskSecret,
  printHealthReport,
  type HealthCheck,
} from '../lib/diagnostics/HealthReport';
import { EXIT_CODES } from '../utils/exitCodes';

const CONFIG_KEYS = [
  { key: 'OPENAI_API_KEY', required: true, secret: true },
  { key: 'OPENAI_BASE_URL', required: false, secret: false },
  { key: 'DEFAULT_SEARCH_MODE', required: false, secret: false },
  { key: 'DEFAULT_SEARCH_TIMEOUT_MS', required: false, secret: false },
  { key: 'DEFAULT_LIVE_ACCESS', required: false, secret: false },
  { key: 'DEFAULT_LOCATION_COUNTRY', required: false, secret: false },
  { key: 'DEFAULT_LOCATION_CITY', required: false, secret: false },
  { key: 'DEFAULT_LOCATION_TIMEZONE', required: false, secret: false },
  { key: 'SEARCH_ALLOWED_DOMAINS', required: false, secret: false },
  { key: 'SEARCH_RATE_LIMIT_PER_MINUTE', required: false, secret: false },
  { key: 'SEARCH_RATE_LIMIT_BURST', required: false, secret: false },
  { key: 'SECURITY_CACHE_TTL', required: false, secret: false },
  { key: 'SECURITY_BLOCK_THRESHOLD', required: false, secret: false },
  { key: 'SECURITY_RATE_LIMIT_PER_MINUTE', required: false, secret: false },
  { key: 'SECURITY_TRUSTED_SOURCES', required: false, secret: false },
  { key: 'REDIS_URL', required: false, secret: false },
  { key: 'LOG_LEVEL', required: false, secret: false },
  { key: 'PORT', required: false, secret: false },
  { key: 'NODE_ENV', required: false, secret: false },
] as const;

type RootProgramOptions = {
  color: boolean;
};

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Manage CLI configuration');

  config
    .command('show')
    .description('Show resolved environment configuration')
    .action(() => {
      const rootOptions = program.opts<RootProgramOptions>();

      const checks: HealthCheck[] = CONFIG_KEYS.map((item) => {
        const rawValue = process.env[item.key];

        if (!rawValue) {
          return {
            name: item.key,
            status: item.required ? 'fail' : 'warn',
            required: item.required,
            details: 'Not set',
          };
        }

        return {
          name: item.key,
          status: 'ok',
          required: item.required,
          details: item.secret ? maskSecret(rawValue) : rawValue,
        };
      });

      const report = printHealthReport(
        '⚙️ WebKurier Config',
        checks,
        rootOptions.color,
      );

      process.exit(
        report.hasBlockingFailures
          ? EXIT_CODES.CONFIG_ERROR
          : EXIT_CODES.SUCCESS,
      );
    });

  config
    .command('get <key>')
    .description('Get a single config value from environment')
    .action((key: string) => {
      const value = process.env[key];

      if (value === undefined) {
        console.error(`❌ "${key}" is not set`);
        process.exit(EXIT_CODES.CONFIG_ERROR);
      }

      console.log(key.toUpperCase().includes('KEY') ? maskSecret(value) : value);
      process.exit(EXIT_CODES.SUCCESS);
    });
}
