#!/usr/bin/env node

/**
 * WebKurier CLI — Terminal interface for AI-powered web search
 *
 * Usage:
 *   webkurier search "query"
 *   webkurier agent security check example.com
 *   webkurier repo clone owner/repo
 */

import { Command } from 'commander';

import { registerSearchCommand } from './commands/search';
import { registerConfigCommand } from './commands/config';
import { registerDoctorCommand } from './commands/doctor';

// 🔥 Новые команды
import { registerAgentCommand } from './commands/agent';
import { registerRepoCommand } from './commands/repo';

import { loadEnvConfig } from './lib/config/EnvLoader';
import { EXIT_CODES } from './utils/exitCodes';

// === Bootstrap ===
const program = new Command();

program
  .name('webkurier')
  .description('🔍 AI-powered CLI for WebKurier ecosystem')
  .version('1.0.0', '-v, --version')
  .option('--debug', 'Enable verbose logging', false)
  .option('--no-color', 'Disable colored output');

// === Load .env BEFORE commands ===
loadEnvConfig();

// === Register commands ===
registerSearchCommand(program);
registerConfigCommand(program);
registerDoctorCommand(program);

// 🔥 Новые команды
registerAgentCommand(program);
registerRepoCommand(program);

// === Unknown command handler ===
program.on('command:*', () => {
  console.error(`❌ Unknown command: ${program.args.join(' ')}`);
  process.exit(EXIT_CODES.GENERAL_ERROR);
});

// === Global error handling ===
process.on('SIGINT', () => {
  console.log('\n⚠️ Interrupted by user');
  process.exit(EXIT_CODES.USER_INTERRUPT);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(EXIT_CODES.UNHANDLED_ERROR);
});

// === Run CLI ===
program
  .parseAsync(process.argv)
  .catch((error: Error) => {
    console.error('💥 CLI Fatal Error:', error.message);

    if (program.opts().debug) {
      console.error(error);
    }

    process.exit(EXIT_CODES.UNHANDLED_ERROR);
  });

