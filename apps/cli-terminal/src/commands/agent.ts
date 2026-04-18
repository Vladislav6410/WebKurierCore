  security
    .command('doctor')
    .description('Check SecurityAgent environment')
    .action(async () => {
      const rootOptions = program.opts<{ color: boolean }>();

      const checks = [
        {
          name: 'OPENAI_API_KEY',
          status: process.env.OPENAI_API_KEY ? 'ok' : 'fail',
          required: true,
          details: process.env.OPENAI_API_KEY
            ? `${process.env.OPENAI_API_KEY.slice(0, 6)}***${process.env.OPENAI_API_KEY.slice(-4)}`
            : 'Not set',
        },
        {
          name: 'REDIS_URL',
          status: process.env.REDIS_URL ? 'ok' : 'warn',
          required: false,
          details: process.env.REDIS_URL ?? 'Not set',
        },
        {
          name: 'SECURITY_CACHE_TTL',
          status: process.env.SECURITY_CACHE_TTL ? 'ok' : 'warn',
          required: false,
          details: process.env.SECURITY_CACHE_TTL ?? 'Using default: 3600',
        },
        {
          name: 'SECURITY_BLOCK_THRESHOLD',
          status: process.env.SECURITY_BLOCK_THRESHOLD ? 'ok' : 'warn',
          required: false,
          details: process.env.SECURITY_BLOCK_THRESHOLD ?? 'Using default: 75',
        },
      ] as const;

      const report = printHealthReport(
        '🛡️ SecurityAgent Doctor',
        [...checks],
        rootOptions.color,
      );

      process.exit(
        report.hasBlockingFailures
          ? EXIT_CODES.CONFIG_ERROR
          : EXIT_CODES.SUCCESS,
      );
    });
