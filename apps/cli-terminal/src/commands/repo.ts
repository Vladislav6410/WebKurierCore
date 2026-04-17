import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';

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

function registerRepoAuthCommands(repo: Command, program: Command): void {
  const auth = repo
    .command('auth')
    .description('GitHub authentication helpers');

  auth
    .command('status')
    .description('Check GitHub CLI authentication status')
    .action(async () => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        await ensureCommandAvailable('gh');

        await execa('gh', ['auth', 'status'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(chalk.red('❌ GitHub authentication is not configured'));
        console.log('💡 Run: webkurier repo auth login');

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
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        await ensureCommandAvailable('gh');

        await execa('gh', ['auth', 'login'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(chalk.red('❌ GitHub login failed'));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });

  auth
    .command('setup-git')
    .description('Configure git to use GitHub CLI credentials')
    .action(async () => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        await ensureCommandAvailable('gh');
        await ensureCommandAvailable('git');

        await execa('gh', ['auth', 'setup-git'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(chalk.red('❌ Failed to configure git authentication'));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });
}

function registerRepoCloneCommand(repo: Command, program: Command): void {
  repo
    .command('clone <repository>')
    .description('Clone a GitHub repository locally')
    .option('-d, --dir <path>', 'Target directory')
    .action(async (repository: string, options: RepoCloneOptions) => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        await ensureCommandAvailable('gh');

        const args = ['repo', 'clone', repository];
        if (options.dir) {
          args.push(options.dir);
        }

        console.log(chalk.bold.cyan('\n📥 Cloning repository'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`Repository: ${repository}`);
        if (options.dir) {
          console.log(`Directory: ${options.dir}`);
        }
        console.log('');

        await execa('gh', args, { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(chalk.red(`❌ Failed to clone repository: ${repository}`));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    });
}

function registerRepoCheckCommand(repo: Command, program: Command): void {
  repo
    .command('check [target]')
    .description('Run repository diagnostics: install, build, typecheck, test')
    .option('--no-install', 'Skip dependency installation')
    .option('--json', 'Print machine-readable report', false)
    .option('--cwd <path>', 'Working directory override')
    .action(async (target: string | undefined, options: RepoCheckOptions) => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        const cwd = resolveTargetDirectory(target, options.cwd);
        const report = await runRepoDiagnostics(cwd, {
          install: options.install !== false,
          color: rootOptions.color,
        });

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          printDiagnosticsReport(report, rootOptions.color);
        }

        process.exit(report.success ? EXIT_CODES.SUCCESS : EXIT_CODES.SEARCH_ERROR);
      } catch (error) {
        console.error(chalk.red('❌ Repository diagnostics failed'));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

function registerRepoFixCommand(repo: Command, program: Command): void {
  repo
    .command('fix [target]')
    .description('Run diagnostics and prepare AI-assisted fix workflow')
    .option('-p, --prompt <text>', 'Optional coding-agent prompt')
    .option('--json', 'Print machine-readable report', false)
    .option('--cwd <path>', 'Working directory override')
    .action(async (target: string | undefined, options: RepoFixOptions) => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        const cwd = resolveTargetDirectory(target, options.cwd);
        const report = await runRepoDiagnostics(cwd, {
          install: true,
          color: rootOptions.color,
        });

        const payload = {
          ...report,
          suggestedNextSteps: buildSuggestedFixSteps(cwd, options.prompt),
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          printDiagnosticsReport(report, rootOptions.color);

          console.log(chalk.bold.cyan('\n🛠️ Fix workflow'));
          console.log(chalk.gray('─'.repeat(60)));
          for (const line of payload.suggestedNextSteps) {
            console.log(line);
          }
        }

        process.exit(report.success ? EXIT_CODES.SUCCESS : EXIT_CODES.SEARCH_ERROR);
      } catch (error) {
        console.error(chalk.red('❌ Fix workflow could not be prepared'));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

function registerRepoPrCommand(repo: Command, program: Command): void {
  repo
    .command('pr [target]')
    .description('Create a pull request from the current branch')
    .option('--cwd <path>', 'Working directory override')
    .action(async (target: string | undefined, options: RepoPrOptions) => {
      const rootOptions = program.opts<RootProgramOptions>();

      try {
        const cwd = resolveTargetDirectory(target, options.cwd);

        await ensureCommandAvailable('gh');
        await ensureCommandAvailable('git');
        ensureDirectoryExists(cwd);

        console.log(chalk.bold.cyan('\n📤 Creating pull request'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`Path: ${cwd}`);
        console.log('');

        await execa('git', ['status', '--short'], {
          cwd,
          stdio: 'inherit',
        });

        await execa('gh', ['pr', 'create', '--fill'], {
          cwd,
          stdio: 'inherit',
        });

        process.exit(EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(chalk.red('❌ Failed to create pull request'));

        if (rootOptions.debug) {
          console.error(error);
        }

        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    });
}

async function runRepoDiagnostics(
  cwd: string,
  options: { install: boolean; color: boolean },
): Promise<{
  path: string;
  success: boolean;
  timestamp: string;
  steps: StepResult[];
}> {
  ensureDirectoryExists(cwd);

  await ensureCommandAvailable('git');
  await ensureCommandAvailable('pnpm');

  const packageJsonPath = path.join(cwd, 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);

  const steps: StepResult[] = [];

  steps.push(await runStep('Check git status', 'git status --short', async () => {
    return execa('git', ['status', '--short'], { cwd });
  }, true));

  if (options.install) {
    steps.push(await runStep('Install dependencies', 'pnpm install', async () => {
      if (!hasPackageJson) {
        return createSkippedResult('Install dependencies', 'pnpm install', 'package.json not found');
      }

      return execa('pnpm', ['install'], { cwd });
    }));
  } else {
    steps.push(createSkippedResult('Install dependencies', 'pnpm install', 'skipped by --no-install'));
  }

  steps.push(await runStep('Build project', 'pnpm build', async () => {
    if (!hasPackageJson) {
      return createSkippedResult('Build project', 'pnpm build', 'package.json not found');
    }

    return execa('pnpm', ['build'], { cwd });
  }, true));

  steps.push(await runStep('Typecheck project', 'pnpm typecheck', async () => {
    if (!hasPackageJson) {
      return createSkippedResult('Typecheck project', 'pnpm typecheck', 'package.json not found');
    }

    return execa('pnpm', ['typecheck'], { cwd });
  }, true));

  steps.push(await runStep('Run tests', 'pnpm test', async () => {
    if (!hasPackageJson) {
      return createSkippedResult('Run tests', 'pnpm test', 'package.json not found');
    }

    return execa('pnpm', ['test'], { cwd });
  }, true));

  const success = steps.every((step) => step.ok || step.skipped);

  return {
    path: cwd,
    success,
    timestamp: new Date().toISOString(),
    steps,
  };
}

async function runStep(
  label: string,
  command: string,
  fn: () => Promise<StepResult | Awaited<ReturnType<typeof execa>>>,
  continueOnError = false,
): Promise<StepResult> {
  try {
    const result = await fn();

    if (isStepResult(result)) {
      return result;
    }

    return {
      label,
      command,
      ok: true,
      code: result.exitCode,
      stdout: sanitizeOutput(result.stdout),
      stderr: sanitizeOutput(result.stderr),
    };
  } catch (error: any) {
    const stepResult: StepResult = {
      label,
      command,
      ok: false,
      code: typeof error?.exitCode === 'number' ? error.exitCode : undefined,
      stdout: sanitizeOutput(error?.stdout),
      stderr: sanitizeOutput(error?.stderr ?? error?.message),
    };

    if (!continueOnError) {
      throw error;
    }

    return stepResult;
  }
}

function createSkippedResult(label: string, command: string, reason: string): StepResult {
  return {
    label,
    command,
    ok: true,
    skipped: true,
    stdout: reason,
  };
}

function isStepResult(value: unknown): value is StepResult {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'label' in value &&
      'command' in value &&
      'ok' in value,
  );
}

function printDiagnosticsReport(
  report: {
    path: string;
    success: boolean;
    timestamp: string;
    steps: StepResult[];
  },
  color: boolean,
): void {
  console.log(color ? chalk.bold.cyan('\n🩺 Repository diagnostics') : '\n🩺 Repository diagnostics');
  console.log(color ? chalk.gray('─'.repeat(60)) : '─'.repeat(60));
  console.log(`Path: ${report.path}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('');

  for (const step of report.steps) {
    const status = step.skipped
      ? color
        ? chalk.yellow('• SKIPPED')
        : '• SKIPPED'
      : step.ok
        ? color
          ? chalk.green('✓ OK')
          : '✓ OK'
        : color
          ? chalk.red('✗ FAIL')
          : '✗ FAIL';

    console.log(`${status} ${step.label}`);
    console.log(`  Command: ${step.command}`);

    if (step.stdout) {
      console.log(`  Output: ${truncateMultiline(step.stdout)}`);
    }

    if (step.stderr && !step.ok) {
      console.log(`  Error: ${truncateMultiline(step.stderr)}`);
    }

    console.log('');
  }

  if (report.success) {
    console.log(color ? chalk.green('✅ Diagnostics passed') : '✅ Diagnostics passed');
  } else {
    console.log(color ? chalk.red('❌ Diagnostics found issues') : '❌ Diagnostics found issues');
  }
}

async function ensureCommandAvailable(command: string): Promise<void> {
  try {
    await execa(command, ['--version']);
  } catch {
    throw new Error(`Required command not found: ${command}`);
  }
}

function resolveTargetDirectory(target?: string, cwdOverride?: string): string {
  if (cwdOverride) {
    return path.resolve(cwdOverride);
  }

  if (target) {
    return path.resolve(target);
  }

  return process.cwd();
}

function ensureDirectoryExists(cwd: string): void {
  if (!fs.existsSync(cwd)) {
    throw new Error(`Directory does not exist: ${cwd}`);
  }

  const stat = fs.statSync(cwd);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${cwd}`);
  }
}

function buildSuggestedFixSteps(cwd: string, prompt?: string): string[] {
  const steps = [
    `1. Review the diagnostics for: ${cwd}`,
    '2. Fix build/typecheck/test failures locally or in your coding agent',
    `3. Re-run: webkurier repo check "${cwd}"`,
    `4. Commit changes and create PR: webkurier repo pr "${cwd}"`,
  ];

  if (prompt) {
    steps.splice(1, 0, `2. Use this prompt in your coding agent: "${prompt}"`);
  }

  return steps;
}

function sanitizeOutput(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function truncateMultiline(value: string, maxLength = 400): string {
  const normalized = value.replace(/\s+\n/g, '\n').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}