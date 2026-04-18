import { Command } from 'commander';
import { execa } from 'execa';
import { EXIT_CODES } from '../utils/exitCodes';
import {
  firstLine,
  maskSecret,
  printHealthReport,
  type HealthCheck,
} from '../lib/diagnostics/HealthReport';

type RootProgramOptions = {
  color: boolean;
};

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run CLI and environment diagnostics')
    .action(async () => {
      const rootOptions = program.opts<RootProgramOptions>();
      const checks: HealthCheck[] = [];

      checks.push(await checkNodeVersion());
      checks.push(await checkCommand('git', true));
      checks.push(await checkCommand('pnpm', true));
      checks.push(await checkCommand('gh', false));
      checks.push(checkEnvVar('OPENAI_API_KEY', true, true));
      checks.push(checkEnvVar('REDIS_URL', false, false));

      const report = printHealthReport(
        '🩺 WebKurier Doctor',
        checks,
        rootOptions.color,
      );

      process.exit(
        report.hasBlockingFailures
          ? EXIT_CODES.CONFIG_ERROR
          : EXIT_CODES.SUCCESS,
      );
    });
}

async function checkNodeVersion(): Promise<HealthCheck> {
  const version = process.versions.node;
  const major = Number(version.split('.')[0]);
  const ok = major >= 20;

  return {
    name: 'Node.js',
    status: ok ? 'ok' : 'fail',
    required: true,
    details: ok ? `Detected ${version}` : `Detected ${version}, requires >= 20`,
  };
}

async function checkCommand(
  command: string,
  required: boolean,
): Promise<HealthCheck> {
  try {
    const result = await execa(command, ['--version']);
    const output = firstLine(result.stdout || result.stderr || '');

    return {
      name: command,
      status: 'ok',
      required,
      details: output || 'Available',
    };
  } catch {
    return {
      name: command,
      status: required ? 'fail' : 'warn',
      required,
      details: 'Not installed or not available in PATH',
    };
  }
}

function checkEnvVar(
  name: string,
  required: boolean,
  maskValue: boolean,
): HealthCheck {
  const value = process.env[name];

  if (!value) {
    return {
      name,
      status: required ? 'fail' : 'warn',
      required,
      details: 'Not set',
    };
  }

  return {
    name,
    status: 'ok',
    required,
    details: maskValue ? maskSecret(value) : value,
  };
}

