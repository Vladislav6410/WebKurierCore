import chalk from 'chalk';
import { Command } from 'commander';

import {
  SecuritySearchAdapter,
  type SecurityCheckResult,
} from '@webkurier/agent-bridge';

import { printHealthReport } from '../lib/diagnostics/HealthReport';
import { EXIT_CODES } from '../utils/exitCodes';

type AgentOptions = {
  mode?: 'fast' | 'agentic';
  format?: 'pretty' | 'json';
  json?: boolean;
};

export function registerAgentCommand(program: Command): void {
  const agent = program.command('agent').description('🤖 Agent tools');

  const security = agent
    .command('security')
    .description('🔐 Security analysis tools');

  // =========================
  // CHECK (fast)
  // =========================
  security
    .command('check')
    .argument('<target>', 'Domain or URL to check')
    .option('-m, --mode <mode>', 'fast | agentic', 'fast')
    .option('--json', 'Output JSON')
    .action(async (target: string, options: AgentOptions) => {
      await runSecurity(target, options, false);
    });

  // =========================
  // ANALYZE (deep)
  // =========================
  security
    .command('analyze')
    .argument('<target>', 'Domain or URL to analyze')
    .option('-m, --mode <mode>', 'fast | agentic', 'agentic')
    .option('--json', 'Output JSON')
    .action(async (target: string, options: AgentOptions) => {
      await runSecurity(target, options, true);
    });

  // =========================
  // DOCTOR (health check)
  // =========================
  security
    .command('doctor')
    .description('Check SecurityAgent environment')
    .action(async () => {
      const rootOptions = program.opts<{ color: boolean }>();

      const checks = [
        {
          name: 'OPENAI_API_KEY',
          status: process.env.OPENAI_API_KEY ? 'ok' : 'fail',
          required: true,
          details: process.env.OPENAI_API_KEY
            ? `${process.env.OPENAI_API_KEY.slice(0, 6)}***${process.env.OPENAI_API_KEY.slice(-4)}`
            : 'Not set',
        },
        {
          name: 'REDIS_URL',
          status: process.env.REDIS_URL ? 'ok' : 'warn',
          required: false,
          details: process.env.REDIS_URL ?? 'Not set',
        },
        {
          name: 'SECURITY_CACHE_TTL',
          status: process.env.SECURITY_CACHE_TTL ? 'ok' : 'warn',
          required: false,
          details:
            process.env.SECURITY_CACHE_TTL ?? 'Using default: 3600',
        },
        {
          name: 'SECURITY_BLOCK_THRESHOLD',
          status: process.env.SECURITY_BLOCK_THRESHOLD ? 'ok' : 'warn',
          required: false,
          details:
            process.env.SECURITY_BLOCK_THRESHOLD ?? 'Using default: 75',
        },
      ] as const;

      const report = printHealthReport(
        '🛡️ SecurityAgent Doctor',
        [...checks],
        rootOptions.color,
      );

      process.exit(
        report.hasBlockingFailures
          ? EXIT_CODES.CONFIG_ERROR
          : EXIT_CODES.SUCCESS,
      );
    });
}

// =========================
// CORE RUNNER
// =========================
async function runSecurity(
  target: string,
  options: AgentOptions,
  forceAgentic: boolean,
): Promise<void> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error(chalk.red('❌ OPENAI_API_KEY not set'));
      process.exit(EXIT_CODES.CONFIG_ERROR);
    }

    const mode = forceAgentic ? 'agentic' : options.mode ?? 'fast';

    const adapter = new SecuritySearchAdapter({
      apiKey: process.env.OPENAI_API_KEY!,
      redisUrl: process.env.REDIS_URL,
    });

    const start = Date.now();

    const result: SecurityCheckResult = await adapter.check(target, {
      mode,
    });

    const duration = Date.now() - start;

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(EXIT_CODES.SUCCESS);
    }

    printPretty(result, duration);

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error: any) {
    console.error(chalk.red('💥 Security check failed:'), error?.message);

    process.exit(EXIT_CODES.SEARCH_ERROR);
  }
}

// =========================
// PRETTY OUTPUT
// =========================
function printPretty(result: SecurityCheckResult, duration: number): void {
  const verdictColor =
    result.verdict === 'safe'
      ? chalk.green
      : result.verdict === 'suspicious'
        ? chalk.yellow
        : chalk.red;

  console.log(chalk.bold('\n🔐 Security Report'));
  console.log(chalk.gray('─'.repeat(60)));

  console.log(
    `Verdict: ${verdictColor(result.verdict.toUpperCase())} (score: ${result.riskScore})`,
  );

  console.log(`Checked: ${result.target}`);
  console.log(`Time: ${duration}ms\n`);

  if (result.findings?.length) {
    console.log(chalk.bold('Findings:'));
    for (const f of result.findings) {
      console.log(` • ${f.message} (${f.source})`);
    }
    console.log('');
  }

  if (result.recommendations?.length) {
    console.log(chalk.bold('Recommendations:'));
    for (const r of result.recommendations) {
      console.log(` → ${r}`);
    }
    console.log('');
  }

  if (result.sources?.length) {
    console.log(chalk.bold('Sources:'));
    for (const s of result.sources) {
      console.log(` - ${s}`);
    }
    console.log('');
  }
}
