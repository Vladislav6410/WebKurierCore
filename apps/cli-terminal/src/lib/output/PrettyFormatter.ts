import chalk from 'chalk';
import { SearchResponse } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';

interface FormatOptions {
  showCitations: boolean;
  showMetadata: boolean;
  color: boolean;
  query?: string;
  duration?: number;
}

export class PrettyFormatter {
  static format(response: SearchResponse, options: FormatOptions): string {
    const { text, citations, metadata } = response;
    const lines: string[] = [];

    if (options.color) {
      lines.push(chalk.bold.cyan('\n🔍 Search Result'));
      lines.push(chalk.gray('─'.repeat(60)));
    } else {
      lines.push('\n🔍 Search Result');
      lines.push('─'.repeat(60));
    }

    const modeBadge = this.getModeBadge(metadata.mode, options.color);
    const modelLabel = options.color ? chalk.gray(`model: ${metadata.model}`) : `model: ${metadata.model}`;
    lines.push(`${modeBadge} ${modelLabel}`);

    if (typeof options.duration === 'number') {
      lines.push(options.color ? chalk.gray(`⏱️  ${options.duration}ms`) : `⏱️  ${options.duration}ms`);
    }

    lines.push('');
    lines.push(text);
    lines.push('');

    if (options.showCitations && citations?.length) {
      lines.push(options.color ? chalk.bold.yellow('📚 Sources:') : '📚 Sources:');

      citations.slice(0, 5).forEach((cite, index) => {
        const num = index + 1;
        const domain = safeHostname(cite.url);

        const numLabel = options.color ? chalk.gray(`[${num}]`) : `[${num}]`;
        const title = options.color ? chalk.blue(cite.title) : cite.title;
        const url = options.color ? chalk.gray(cite.url) : cite.url;
        const domainLabel = options.color ? chalk.dim(`(${domain})`) : `(${domain})`;

        lines.push(`  ${numLabel} ${title}`);
        lines.push(`      ${url} ${domainLabel}`);
      });

      if (citations.length > 5) {
        const more = `... and ${citations.length - 5} more`;
        lines.push(`  ${options.color ? chalk.gray(more) : more}`);
      }

      lines.push('');
    }

    if (options.showMetadata) {
      lines.push(options.color ? chalk.gray('📊 Meta') : '📊 Meta');
      lines.push(`  Mode: ${metadata.mode}`);
      if (metadata.tokensUsed !== undefined) {
        lines.push(`  Tokens: ${metadata.tokensUsed}`);
      }
      if (metadata.searchQueries?.length) {
        lines.push(`  Sub-queries: ${metadata.searchQueries.join(', ')}`);
      }
      lines.push('');
    }

    lines.push(
      options.color
        ? chalk.dim('💡 Tip: Use --format json for scripting | --help for options')
        : '💡 Tip: Use --format json for scripting | --help for options',
    );

    return lines.join('\n');
  }

  static printDryRun(query: string, config: any, color = true): void {
    const c = color ? chalk : new NoColorChalk();

    console.log(c.bold.cyan('\n🧪 Dry Run — Request Preview'));
    console.log(c.gray('─'.repeat(60)));
    console.log(c.bold('Query:'), query);
    console.log(c.bold('Mode:'), this.getModeBadge(config.mode, color));

    if (config.location) {
      const parts = [config.location.city, config.location.region, config.location.country].filter(Boolean);
      console.log(c.bold('Location:'), parts.join(', '));
    }

    if (config.location?.timezone) {
      console.log(c.bold('Timezone:'), config.location.timezone);
    }

    if (config.domainFilters?.allowedDomains?.length) {
      console.log(c.bold('Domains:'), config.domainFilters.allowedDomains.join(', '));
    }

    console.log(
      c.bold('Live Access:'),
      config.liveAccess !== false ? c.green('yes') : c.yellow('cached only'),
    );
    console.log(c.bold('Timeout:'), `${config.timeoutMs ?? 30000}ms`);
    console.log('');
    console.log(c.dim('✅ Run without --dry-run to execute'));
  }

  private static getModeBadge(mode: SearchMode, color: boolean): string {
    const badges: Record<SearchMode, string> = {
      fast: color ? chalk.bgGreen.black(' FAST ') : '[FAST]',
      agentic: color ? chalk.bgBlue.white(' AGENTIC ') : '[AGENTIC]',
      deep: color ? chalk.bgMagenta.white(' DEEP ') : '[DEEP]',
    };

    return badges[mode];
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'invalid-url';
  }
}

class NoColorChalk {
  bold = Object.assign((value: string) => value, {
    cyan: (value: string) => value,
  });

  gray(value: string) {
    return value;
  }

  green(value: string) {
    return value;
  }

  yellow(value: string) {
    return value;
  }

  dim(value: string) {
    return value;
  }
}

