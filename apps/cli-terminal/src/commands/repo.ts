import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import { EXIT_CODES } from '../utils/exitCodes';

type RepoCheckOptions = {
  install?: boolean;
};

type RepoCloneOptions = {
  dir?: string;
};

type RepoFixOptions = {
  prompt?: string;
};

export function registerRepoCommand(program: Command): void {
  const repo = program
    .command('repo')
    .description('GitHub repository operations and diagnostics');

  registerRepoAuthCommand(repo);
  registerRepoCloneCommand(repo);
  registerRepoCheckCommand(repo);
  registerRepoFixCommand(repo);
  registerRepoPrCommand(repo);
}

function registerRepoAuthCommand(repo: Command): void {
  const auth = repo.command('auth').description('GitHub authentication helpers');

  auth
    .command('status')
    .description('Check GitHub CLI authentication status')
    .action(async () => {
      try {
        await execa('gh', ['auth', 'status'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch {
        console.error(chalk.red('❌ GitHub authentication is not configured'));
        console.log('💡 Run: gh auth login');
        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });

  auth
    .command('login')
    .description('Start GitHub CLI login flow')
    .action(async () => {
      try {
        await execa('gh', ['auth', 'login'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red('❌ GitHub login failed'));
        console.error(error);
        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });

  auth
    .command('setup-git')
    .description('Configure git to use GitHub CLI credentials')
    .action(async () => {
      try {
        await execa('gh', ['auth', 'setup-git'], { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red('❌ Failed to configure git authentication'));
        console.error(error);
        process.exit(EXIT_CODES.AUTH_ERROR);
      }
    });
}

function registerRepoCloneCommand(repo: Command): void {
  repo
    .command('clone <repository>')
    .description('Clone a GitHub repository locally')
    .option('-d, --dir <path>', 'Target directory')
    .action(async (repository: string, options: RepoCloneOptions) => {
      try {
        const args = ['repo', 'clone', repository];

        if (options.dir) {
          args.push(options.dir);
        }

        await execa('gh', args, { stdio: 'inherit' });
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red(`❌ Failed to clone repository: ${repository}`));
        console.error(error);
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    });
}

function registerRepoCheckCommand(repo: Command): void {
  repo
    .command('check <target>')
    .description('Run repository diagnostics: install, build, typecheck, test')
    .option('--no-install', 'Skip pnpm install')
    .action(async (target: string, options: RepoCheckOptions) => {
      try {
        await runRepoDiagnostics(target, {
          install: options.install !== false,
        });

        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red('❌ Repository diagnostics failed'));
        console.error(error);
        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

function registerRepoFixCommand(repo: Command): void {
  repo
    .command('fix <target>')
    .description('Run diagnostics and prepare AI-assisted fix workflow')
    .option('-p, --prompt <text>', 'Optional Copilot/Coding prompt')
    .action(async (target: string, options: RepoFixOptions) => {
      try {
        await runRepoDiagnostics(target, { install: true });

        console.log('');
        console.log(chalk.bold.cyan('🛠️ Fix workflow ready'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`Target: ${target}`);

        if (options.prompt) {
          console.log(`Prompt: ${options.prompt}`);
        }

        console.log('');
        console.log(chalk.yellow('Next recommended steps:'));
        console.log('  1. Review build/typecheck/test output above');
        console.log('  2. Open the repo in your coding agent / Copilot CLI');
        console.log('  3. Apply fixes and rerun: webkurier repo check <target>');
        console.log('  4. Create PR with: webkurier repo pr <target>');
        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red('❌ Fix workflow could not be prepared'));
        console.error(error);
        process.exit(EXIT_CODES.SEARCH_ERROR);
      }
    });
}

function registerRepoPrCommand(repo: Command): void {
  repo
    .command('pr <target>')
    .description('Create a pull request from the current branch')
    .action(async (target: string) => {
      try {
        console.log(chalk.bold.cyan('\n📤 Creating pull request'));
        console.log(chalk.gray('─'.repeat(60)));

        await execa('git', ['status', '--short'], {
          cwd: target,
          stdio: 'inherit',
        });

        await execa('gh', ['pr', 'create', '--fill'], {
          cwd: target,
          stdio: 'inherit',
        });

        process.exit(EXIT_CODES.SUCCESS);
      } catch (error: unknown) {
        console.error(chalk.red('❌ Failed to create pull request'));
        console.error(error);
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    });
}

async function runRepoDiagnostics(
  target: string,
  options: { install: boolean },
): Promise<void> {
  const cwd = target;

  console.log(chalk.bold.cyan('\n🩺 Repository diagnostics'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`Path: ${cwd}`);
  console.log('');

  await runStep('Check git status', async () => {
    await execa('git', ['status', '--short'], { cwd, stdio: 'inherit' });
  }, true);

  if (options.install) {
    await runStep('Install dependencies', async () => {
      await execa('pnpm', ['install'], { cwd, stdio: 'inherit' });
    });
  }

  await runStep('Build project', async () => {
    await execa('pnpm', ['build'], { cwd, stdio: 'inherit' });
  }, true);

  await runStep('Typecheck project', async () => {
    await execa('pnpm', ['typecheck'], { cwd, stdio: 'inherit' });
  }, true);

  await runStep('Run tests', async () => {
    await execa('pnpm', ['test'], { cwd, stdio: 'inherit' });
  }, true);
}

async function runStep(
  label: string,
  fn: () => Promise<void>,
  continueOnError = false,
): Promise<void> {
  console.log(chalk.bold(label));

  try {
    await fn();
    console.log(chalk.green(`✓ ${label}`));
  } catch (error) {
    console.log(chalk.red(`✗ ${label}`));

    if (!continueOnError) {
      throw error;
    }
  }

  console.log('');
}