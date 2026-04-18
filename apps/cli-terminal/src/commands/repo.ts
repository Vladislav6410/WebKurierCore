import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';

import {
  firstLine,
  printHealthReport,
} from '../lib/diagnostics/HealthReport';

import { EXIT_CODES } from '../utils/exitCodes';

type RepoCloneOptions = {
  dir?: string;
};

type RepoCheckOptions = {
  install?: boolean;
  json?: boolean;
  cwd?: string;
};

type RepoFixOptions = {
  prompt?: string;
  json?: boolean;
  cwd?: string;
};

type RepoPrOptions = {
  cwd?: string;
};

type RootProgramOptions = {
  debug: boolean;
  color: boolean;
};

type StepResult = {
  label: string;
  command: string;
  ok: boolean;
  code?: number;
  stdout?: string;
  stderr?: string;
  skipped?: boolean;
};

export function registerRepoCommand(program: Command): void {
  const repo = program
    .command('repo')
    .description('GitHub repository operations and diagnostics');

  registerRepoAuthCommands(repo, program);
  registerRepoCloneCommand(repo, program);
  registerRepoCheckCommand(repo, program);
  registerRepoFixCommand(repo, program);
  registerRepoPrCommand(repo, program);
}

// =========================
// AUTH
// =========================
function registerRepoAuthCommands(repo: Command, program: Command): void {
  const auth = repo
    .command('auth')
    .description('GitHub authentication helpers');

  // 🔥 ОБНОВЛЁННЫЙ STATUS
  auth
    .command('status')
    .description('Check GitHub CLI authentication status')
    .action(async () => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        const checks = [];

        try {
          await ensureCommandAvailable('gh');
          checks.push({
            name: 'gh',
            status: 'ok' as const,
            required: true,
            details: 'Installed and available',
          });
        } catch {
          checks.push({
            name: 'gh',
            status: 'fail' as const,
            required: true,
            details: 'Not installed or not available in PATH',
          });

          const report = printHealthReport(
            '🐙 GitHub Auth Status',
            checks,
            rootOptions.color,
          );

          process.exit(
            report.hasBlockingFailures
              ? EXIT_CODES.AUTH_ERROR
              : EXIT_CODES.SUCCESS,
          );
        }

        try {
          const result = await execa('gh', ['auth', 'status']);
          const output = firstLine(result.stdout || result.stderr || '');

          checks.push({
            name: 'GitHub authentication',
            status: 'ok' as const,
            required: true,
            details: output || 'Authenticated',
          });
        } catch (error: any) {
          checks.push({
            name: 'GitHub authentication',
            status: 'fail' as const,
            required: true,
            details: firstLine(
              error?.stderr || error?.stdout || 'Not authenticated',
            ),
          });
        }

        const report = printHealthReport(
          '🐙 GitHub Auth Status',
          checks,
          rootOptions.color,
        );

        process.exit(
          report.hasBlockingFailures
            ? EXIT_CODES.AUTH_ERROR
            : EXIT_CODES.SUCCESS,
        );
      } catch (error) {
        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });

  auth
    .command('login')
    .description('Start GitHub CLI login flow')
    .action(async () => {
      await ensureCommandAvailable('gh');
      await execa('gh', ['auth', 'login'], { stdio: 'inherit' });
    });

  auth
    .command('setup-git')
    .description('Configure git to use GitHub CLI credentials')
    .action(async () => {
      await ensureCommandAvailable('gh');
      await ensureCommandAvailable('git');
      await execa('gh', ['auth', 'setup-git'], { stdio: 'inherit' });
    });
}

// =========================
// CLONE
// =========================
function registerRepoCloneCommand(repo: Command, program: Command): void {
  repo
    .command('clone <repository>')
    .option('-d, --dir <path>')
    .action(async (repository: string, options: RepoCloneOptions) => {
      await ensureCommandAvailable('gh');

      const args = ['repo', 'clone', repository];
      if (options.dir) args.push(options.dir);

      await execa('gh', args, { stdio: 'inherit' });
    });
}

// =========================
// CHECK
// =========================
function registerRepoCheckCommand(repo: Command, program: Command): void {
  repo
    .command('check [target]')
    .option('--no-install')
    .option('--json', false)
    .option('--cwd <path>')
    .action(async (target: string | undefined, options: RepoCheckOptions) => {
      const cwd = resolveTargetDirectory(target, options.cwd);

      const report = await runRepoDiagnostics(cwd, {
        install: options.install !== false,
        color: true,
      });

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printDiagnosticsReport(report, true);
      }

      process.exit(
        report.success ? EXIT_CODES.SUCCESS : EXIT_CODES.SEARCH_ERROR,
      );
    });
}

// =========================
// FIX
// =========================
function registerRepoFixCommand(repo: Command, program: Command): void {
  repo
    .command('fix [target]')
    .option('-p, --prompt <text>')
    .option('--json', false)
    .option('--cwd <path>')
    .action(async (target: string | undefined, options: RepoFixOptions) => {
      const cwd = resolveTargetDirectory(target, options.cwd);

      const report = await runRepoDiagnostics(cwd, {
        install: true,
        color: true,
      });

      const payload = {
        ...report,
        suggestedNextSteps: buildSuggestedFixSteps(cwd, options.prompt),
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        printDiagnosticsReport(report, true);

        console.log(chalk.bold.cyan('\n🛠️ Fix workflow'));
        console.log(chalk.gray('─'.repeat(60)));

        for (const step of payload.suggestedNextSteps) {
          console.log(step);
        }
      }

      process.exit(
        report.success ? EXIT_CODES.SUCCESS : EXIT_CODES.SEARCH_ERROR,
      );
    });
}

// =========================
// PR
// =========================
function registerRepoPrCommand(repo: Command, program: Command): void {
  repo
    .command('pr [target]')
    .option('--cwd <path>')
    .action(async (target: string | undefined, options: RepoPrOptions) => {
      const cwd = resolveTargetDirectory(target, options.cwd);

      await ensureCommandAvailable('gh');
      await ensureCommandAvailable('git');

      await execa('gh', ['pr', 'create', '--fill'], {
        cwd,
        stdio: 'inherit',
      });
    });
}

// =========================
// HELPERS (без изменений)
// =========================

async function ensureCommandAvailable(command: string): Promise<void> {
  try {
    await execa(command, ['--version']);
  } catch {
    throw new Error(`Required command not found: ${command}`);
  }
}

function resolveTargetDirectory(target?: string, cwdOverride?: string): string {
  if (cwdOverride) return path.resolve(cwdOverride);
  if (target) return path.resolve(target);
  return process.cwd();
}

function buildSuggestedFixSteps(cwd: string, prompt?: string): string[] {
  const steps = [
    `1. Review diagnostics for: ${cwd}`,
    '2. Fix errors locally or via AI agent',
    `3. Re-run: webkurier repo check "${cwd}"`,
    `4. Create PR: webkurier repo pr "${cwd}"`,
  ];

  if (prompt) {
    steps.splice(1, 0, `2. Use prompt: "${prompt}"`);
  }

  return steps;
}

function printDiagnosticsReport(report: any, color: boolean): void {
  console.log('\n🩺 Repository diagnostics');
  console.log('─'.repeat(60));

  for (const step of report.steps) {
    const status = step.ok ? '✓' : '✗';
    console.log(`${status} ${step.label}`);
  }
}

async function runRepoDiagnostics(
  cwd: string,
  options: { install: boolean; color: boolean },
) {
  await ensureCommandAvailable('git');
  await ensureCommandAvailable('pnpm');

  const steps: StepResult[] = [];

  steps.push(await runStep('git status', 'git status', () =>
    execa('git', ['status'], { cwd }),
  ));

  return {
    path: cwd,
    success: steps.every((s) => s.ok),
    timestamp: new Date().toISOString(),
    steps,
  };
}

async function runStep(
  label: string,
  command: string,
  fn: () => Promise<any>,
): Promise<StepResult> {
  try {
    const result = await fn();
    return {
      label,
      command,
      ok: true,
      stdout: result.stdout,
    };
  } catch (error: any) {
    return {
      label,
      command,
      ok: false,
      stderr: error.message,
    };
  }
}