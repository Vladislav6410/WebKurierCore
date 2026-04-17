import chalk from 'chalk';
import { Command } from 'commander';

import { SecuritySearchAdapter } from '@webkurier/agent-bridge/security';

import { JsonFormatter } from '../lib/output/JsonFormatter';
import { MarkdownFormatter } from '../lib/output/MarkdownFormatter';
import { PrettyFormatter } from '../lib/output/PrettyFormatter';
import { TableFormatter } from '../lib/output/TableFormatter';
import { EXIT_CODES } from '../utils/exitCodes';

type SecurityCommandOptions = {
  mode?: 'fast' | 'agentic';
  format?: 'pretty' | 'json' | 'table' | 'md' | 'markdown';
};

export function registerAgentCommand(program: Command): void {
  const agent = program.command('agent').description('Agent bridge commands');

  const security = agent
    .command('security')
    .description('SecurityAgent operations');

  security
    .command('check <target>')
    .description('Fast security check for URL or domain')
    .option('-m, --mode <mode>', 'Execution mode: fast | agentic', 'fast')
    .option('-f, --format <format>', 'Output format: pretty | json | table | md', 'pretty')
    .action(async (target: string, options: SecurityCommandOptions) => {
      await runSecurityCommand('check', target, options);
    });

  security
    .command('analyze <target>')
    .description('Deeper security analysis for URL or domain')
    .option('-m, --mode <mode>', 'Execution mode: fast | agentic', 'agentic')
    .option('-f, --format <format>', 'Output format: pretty | json | table | md', 'pretty')
    .action(async (target: string, options: SecurityCommandOptions) => {
      await runSecurityCommand('analyze', target, options);
    });

  security
    .command('doctor')
    .description('Check SecurityAgent environment')
    .action(() => {
      const required = ['OPENAI_API_KEY'];
      const missing = required.filter((key) => !process.env[key]);

      if (missing.length) {
        console.error(chalk.red(`❌ Missing environment variables: ${missing.join(', ')}`));
        process.exit(EXIT_CODES.CONFIG_ERROR);
      }

      console.log(chalk.green('✅ SecurityAgent environment looks good'));
      process.exit(EXIT_CODES.SUCCESS);
    });
}

async function runSecurityCommand(
  action: 'check' | 'analyze',
  target: string,
  options: SecurityCommandOptions,
): Promise<void> {
  try {
    const adapter = new SecuritySearchAdapter();
    const mode = normalizeMode(options.mode, action);
    const format = normalizeFormat(options.format);

    const result = await adapter.check(target, { mode });

    const responseForFormatters = mapSecurityResultToFormatterResponse(result);

    const formatterOptions = {
      showCitations: true,
      showMetadata: true,
      color: true,
      query: target,
      duration: responseForFormatters.metadata?.durationMs,
    };

    let output = '';

    switch (format) {
      case 'json':
        output = JsonFormatter.format(responseForFormatters, formatterOptions);
        break;
      case 'table':
        output = TableFormatter.format(responseForFormatters, formatterOptions);
        break;
      case 'md':
        output = MarkdownFormatter.format(responseForFormatters, formatterOptions);
        break;
      default:
        output = PrettyFormatter.format(responseForFormatters as any, formatterOptions);
        break;
    }

    console.log(output);
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error: unknown) {
    console.error(chalk.red('❌ Security agent execution failed'));
    console.error(error);
    process.exit(EXIT_CODES.SEARCH_ERROR);
  }
}

function normalizeMode(
  mode: string | undefined,
  action: 'check' | 'analyze',
): 'fast' | 'agentic' {
  if (mode === 'fast' || mode === 'agentic') {
    return mode;
  }

  return action === 'analyze' ? 'agentic' : 'fast';
}

function normalizeFormat(
  format?: string,
): 'pretty' | 'json' | 'table' | 'md' {
  if (format === 'markdown') {
    return 'md';
  }

  if (format === 'json' || format === 'table' || format === 'md') {
    return format;
  }

  return 'pretty';
}

function mapSecurityResultToFormatterResponse(result: any) {
  const findingsText = Array.isArray(result.findings) && result.findings.length
    ? result.findings.map((item: string) => `• ${item}`).join('\n')
    : '• No significant findings';

  const recommendationsText = Array.isArray(result.recommendations) && result.recommendations.length
    ? result.recommendations.map((item: string) => `• ${item}`).join('\n')
    : '• No additional recommendations';

  const text = [
    `Verdict: ${String(result.verdict).toUpperCase()}`,
    `Risk score: ${result.riskScore}`,
    '',
    'Findings:',
    findingsText,
    '',
    'Recommendations:',
    recommendationsText,
  ].join('\n');

  return {
    text,
    citations: result.sources ?? [],
    metadata: {
      mode: result.metadata?.mode ?? 'fast',
      model: result.metadata?.model ?? 'security-agent',
      tokensUsed: result.metadata?.tokensUsed ?? 0,
      searchQueries: result.metadata?.searchQueries ?? [],
      durationMs: result.metadata?.durationMs ?? 0,
    },
  };
}