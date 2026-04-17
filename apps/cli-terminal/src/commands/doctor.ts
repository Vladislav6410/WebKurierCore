import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import { EXIT_CODES } from '../utils/exitCodes';

type DiagnosticCheck = {
  name: string;
  ok: boolean;
  required: boolean;
  details: string;
};

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run CLI and environment diagnostics')
    .action(async () => {
      const checks: DiagnosticCheck[] = [];

      checks.push(await checkNodeVersion());
      checks.push(await checkCommand('git', true));
      checks.push(await checkCommand('pnpm', true));
      checks.push(await checkCommand('gh', false));
      checks.push(checkEnvVar('OPENAI_API_KEY', true, true));
      checks.push(checkEnvVar('REDIS_URL', false, false));

      console.log(chalk.bold.cyan('\n🩺 WebKurier Doctor'));
      console.log(chalk.gray('─'.repeat(60)));

      let hasRequiredFailures = false;

      for (const check of checks) {
        const icon = check.ok
          ? chalk.green('✓')
          : check.required
            ? chalk.red('✗')
            : chalk.yellow('⚠');

        const requiredLabel = check.required
          ? chalk.gray('(required)')
          : chalk.gray('(optional)');

        console.log(`${icon} ${chalk.bold(check.name)} ${requiredLabel} — ${check.details}`);

        if (!check.ok && check.required) {
          hasRequiredFailures = true;
        }
      }

      console.log('');

      if (hasRequiredFailures) {
        console.log(chalk.red('❌ Diagnostics completed with blocking issues'));
        process.exit(EXIT_CODES.CONFIG_ERROR);
      }

      console.log(chalk.green('✅ Diagnostics completed successfully'));
      process.exit(EXIT_CODES.SUCCESS);
    });
}

async function checkNodeVersion(): Promise<DiagnosticCheck> {
  const version = process.versions.node;
  const major = Number(version.split('.')[0]);
  const ok = major >= 20;

  return {
    name: 'Node.js',
    ok,
    required: true,
    details: ok ? `Detected ${version}` : `Detected ${version}, requires >= 20`,
  };
}

async function checkCommand(
  command: string,
  required: boolean,
): Promise<DiagnosticCheck> {
  try {
    const result = await execa(command, ['--version']);
    const output = firstLine(result.stdout || result.stderr || '');

    return {
      name: command,
      ok: true,
      required,
      details: output || 'Available',
    };
  } catch {
    return {
      name: command,
      ok: false,
      required,
      details: 'Not installed or not available in PATH',
    };
  }
}

function checkEnvVar(
  name: string,
  required: boolean,
  maskValue: boolean,
): DiagnosticCheck {
  const value = process.env[name];

  if (!value) {
    return {
      name,
      ok: false,
      required,
      details: 'Not set',
    };
  }

  return {
    name,
    ok: true,
    required,
    details: maskValue ? maskSecret(value) : value,
  };
}

function maskSecret(value: string): string {
  if (value.length <= 10) {
    return '***';
  }

  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

function firstLine(value: string): string {
  return value.split('\n')[0]?.trim() ?? '';
}
