import chalk from 'chalk';

export type HealthStatus = 'ok' | 'warn' | 'fail';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  required: boolean;
  details: string;
}

export function printHealthReport(
  title: string,
  checks: HealthCheck[],
  color = true,
): { hasBlockingFailures: boolean } {
  const c = color ? chalk : noColor();

  console.log(c.bold.cyan(`\n${title}`));
  console.log(c.gray('─'.repeat(60)));

  let hasBlockingFailures = false;

  for (const check of checks) {
    const icon =
      check.status === 'ok'
        ? c.green('✓')
        : check.status === 'warn'
          ? c.yellow('⚠')
          : c.red('✗');

    const label = check.required ? c.gray('(required)') : c.gray('(optional)');

    console.log(`${icon} ${c.bold(check.name)} ${label} — ${check.details}`);

    if (check.status === 'fail' && check.required) {
      hasBlockingFailures = true;
    }
  }

  console.log('');

  if (hasBlockingFailures) {
    console.log(c.red('❌ Diagnostics completed with blocking issues'));
  } else {
    console.log(c.green('✅ Diagnostics completed successfully'));
  }

  return { hasBlockingFailures };
}

export function maskSecret(value: string): string {
  if (value.length <= 10) {
    return '***';
  }

  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

export function firstLine(value: string): string {
  return value.split('\n')[0]?.trim() ?? '';
}

function noColor() {
  return {
    bold: Object.assign((value: string) => value, {
      cyan: (value: string) => value,
    }),
    gray: (value: string) => value,
    green: (value: string) => value,
    yellow: (value: string) => value,
    red: (value: string) => value,
  };
}