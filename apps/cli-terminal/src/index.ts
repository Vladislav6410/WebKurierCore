#!/usr/bin/env node

/**
 * WebKurier CLI — Terminal interface for AI-powered web search
 * 
 * Usage:
 *   webkurier search "your query" [options]
 *   webkurier config show
 *   webkurier doctor
 */

import { Command } from 'commander';
import { registerSearchCommand } from './commands/search';
import { registerConfigCommand } from './commands/config';
import { registerDoctorCommand } from './commands/doctor';
import { loadEnvConfig } from './lib/config/EnvLoader';
import { EXIT_CODES } from './utils/exitCodes';

// Bootstrap
const program = new Command();

program
  .name('webkurier')
  .description('🔍 AI-powered web search CLI for WebKurier ecosystem')
  .version('1.0.0', '-v, --version')
  .option('--debug', 'Enable verbose logging', false)
  .option('--no-color', 'Disable colored output', true);

// Загрузка конфигурации из .env (до регистрации команд)
loadEnvConfig();

// Регистрация команд
registerSearchCommand(program);
registerConfigCommand(program);
registerDoctorCommand(program);

// Обработка неизвестных команд
program.on('command:*', () => {
  console.error(`❌ Unknown command: ${program.args.join(' ')}`);
  program.help({ error: true });
});

// Graceful error handling
process.on('SIGINT', () => {
  console.log('\n⚠️  Interrupted by user');
  process.exit(EXIT_CODES.USER_INTERRUPT);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(EXIT_CODES.UNHANDLED_ERROR);
});

// Запуск
program.parseAsync(process.argv)
  .catch((error) => {
    console.error('💥 CLI Fatal Error:', error.message);
    process.exit(EXIT_CODES.UNHANDLED_ERROR);
  });

