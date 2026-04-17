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
    const modelText = options.color
      ? chalk.gray(`model: ${metadata.model}`)
      : `model: ${metadata.model}`;

    lines.push(`${modeBadge} ${modelText}`);

    if (typeof options.duration === 'number') {
      const durationText = `⏱️  ${options.duration}ms`;
      lines.push(options.color ? chalk.gray(durationText) : durationText);
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
        const titleLabel = options.color ? chalk.blue(cite.title) : cite.title;
        const urlLabel = options.color ? chalk.gray(cite.url) : cite.url;
        const domainLabel = options.color ? chalk.dim(`(${domain})`) : `(${domain})`;

        lines.push(`  ${numLabel} ${titleLabel}`);
        lines.push(`      ${urlLabel} ${domainLabel}`);
      });

      if (citations.length > 5) {
        const moreLabel = `... and ${citations.length - 5} more`;
        lines.push(`  ${options.color ? chalk.gray(moreLabel) : moreLabel}`);
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
    const title = '\n🧪 Dry Run — Request Preview';
    const hr = '─'.repeat(60);

    console.log(color ? chalk.bold.cyan(title) : title);
    console.log(color ? chalk.gray(hr) : hr);
    console.log(color ? chalk.bold('Query:') : 'Query:', query);
    console.log(color ? chalk.bold('Mode:') : 'Mode:', this.getModeBadge(config.mode, color));

    if (config.location) {
      const locationParts = [
        config.location.city,
        config.location.region,
        config.location.country,
      ].filter(Boolean);

      console.log(
        color ? chalk.bold('Location:') : 'Location:',
        locationParts.join(', '),
      );
    }

    if (config.location?.timezone) {
      console.log(
        color ? chalk.bold('Timezone:') : 'Timezone:',
        config.location.timezone,
      );
    }

    if (config.domainFilters?.allowedDomains?.length) {
      console.log(
        color ? chalk.bold('Domains:') : 'Domains:',
        config.domainFilters.allowedDomains.join(', '),
      );
    }

    const liveText = config.liveAccess !== false ? 'yes' : 'cached only';
    const liveLabel = color
      ? config.liveAccess !== false
        ? chalk.green(liveText)
        : chalk.yellow(liveText)
      : liveText;

    console.log(color ? chalk.bold('Live Access:') : 'Live Access:', liveLabel);
    console.log(
      color ? chalk.bold('Timeout:') : 'Timeout:',
      `${config.timeoutMs ?? 30000}ms`,
    );
    console.log('');
    console.log(
      color
        ? chalk.dim('✅ Run without --dry-run to execute')
        : '✅ Run without --dry-run to execute',
    );
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

