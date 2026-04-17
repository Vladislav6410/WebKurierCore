import chalk from 'chalk';
import { Command } from 'commander';
import { EXIT_CODES } from '../utils/exitCodes';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run CLI diagnostics')
    .action(() => {
      const checks = [
        {
          name: 'Node.js version',
          ok: Number(process.versions.node.split('.')[0]) >= 20,
          details: `Detected ${process.versions.node}`,
        },
        {
          name: 'OPENAI_API_KEY',
          ok: Boolean(process.env.OPENAI_API_KEY),
          details: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
        },
        {
          name: 'OPENAI_BASE_URL',
          ok: true,
          details: process.env.OPENAI_BASE_URL || 'Default OpenAI base URL',
        },
        {
          name: 'Default location country',
          ok: true,
          details: process.env.DEFAULT_LOCATION_COUNTRY || 'Not set',
        },
        {
          name: 'Allowed domains',
          ok: true,
          details: process.env.SEARCH_ALLOWED_DOMAINS || 'Not set',
        },
      ];

      console.log(chalk.bold.cyan('\n🩺 WebKurier Doctor'));
      console.log(chalk.gray('─'.repeat(60)));

      let hasErrors = false;

      for (const check of checks) {
        const icon = check.ok ? chalk.green('✓') : chalk.red('✗');
        console.log(`${icon} ${chalk.bold(check.name)} — ${check.details}`);
        if (!check.ok) hasErrors = true;
      }

      console.log('');

      if (hasErrors) {
        console.log(chalk.yellow('⚠️ Diagnostics completed with issues'));
        process.exit(EXIT_CODES.CONFIG_ERROR);
      }

      console.log(chalk.green('✅ Diagnostics passed'));
      process.exit(EXIT_CODES.SUCCESS);
    });
}