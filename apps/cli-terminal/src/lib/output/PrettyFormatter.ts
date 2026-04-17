import chalk from 'chalk';
import { SearchResponse } from '@webkurier/websearch-core';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';

interface FormatOptions {
  showCitations: boolean;
  showMeta boolean;
  color: boolean;
  query?: string;
  duration?: number;
}

export class PrettyFormatter {
  static format(response: SearchResponse, options: FormatOptions): string {
    const { text, citations, metadata } = response;
    const lines: string[] = [];

    // Header
    if (options.color) {
      lines.push(chalk.bold.cyan('\n🔍 Search Result'));
      lines.push(chalk.gray('─'.repeat(60)));
    } else {
      lines.push('\n🔍 Search Result');
      lines.push('─'.repeat(60));
    }

    // Mode badge
    const modeBadge = this.getModeBadge(metadata.mode, options.color);
    lines.push(`${modeBadge} ${chalk.gray(`model: ${metadata.model}`)}`);
    
    if (options.duration) {
      lines.push(chalk.gray(`⏱️  ${metadata.durationMs}ms`));
    }
    lines.push('');

    // Main answer
    lines.push(text);
    lines.push('');

    // Citations
    if (options.showCitations && citations?.length) {
      if (options.color) {
        lines.push(chalk.bold.yellow('\n📚 Sources:'));
      } else {
        lines.push('\n📚 Sources:');
      }
      
      citations.slice(0, 5).forEach((cite, i) => {
        const num = i + 1;
        const domain = new URL(cite.url).hostname;
        lines.push(`  ${chalk.gray(`[${num}]`)} ${chalk.blue(cite.title)}`);
        lines.push(`      ${chalk.gray(cite.url)} ${chalk.dim(`(${domain})`)}`);
      });
      
      if (citations.length > 5) {
        lines.push(`  ${chalk.gray(`... and ${citations.length - 5} more`)}`);
      }
      lines.push('');
    }

    // Metadata (debug/verbose)
    if (options.showMetadata) {
      if (options.color) {
        lines.push(chalk.gray('\n📊 Meta'));
      } else {
        lines.push('\n📊 Meta');
      }
      lines.push(`  Mode: ${metadata.mode}`);
      lines.push(`  Tokens: ${metadata.tokensUsed}`);
      if (metadata.searchQueries?.length) {
        lines.push(`  Sub-queries: ${metadata.searchQueries.join(', ')}`);
      }
    }

    // Footer tip
    lines.push('');
    if (options.color) {
      lines.push(chalk.dim('💡 Tip: Use --format json for scripting | --help for options'));
    } else {
      lines.push('💡 Tip: Use --format json for scripting | --help for options');
    }

    return lines.join('\n');
  }

  static printDryRun(query: string, config: any): void {
    console.log(chalk.bold.cyan('\n🧪 Dry Run — Request Preview'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('Query:'), query);
    console.log(chalk.bold('Mode:'), this.getModeBadge(config.mode, true));
    
    if (config.location) {
      console.log(chalk.bold('Location:'), `${config.location.city ?? ''} ${config.location.country}`.trim());
    }
    
    if (config.domainFilters?.allowedDomains?.length) {
      console.log(chalk.bold('Domains:'), config.domainFilters.allowedDomains.join(', '));
    }
    
    console.log(chalk.bold('Live Access:'), config.liveAccess !== false ? chalk.green('yes') : chalk.yellow('cached only'));
    console.log(chalk.bold('Timeout:'), `${config.timeoutMs ?? 30000}ms`);
    console.log('');
    console.log(chalk.dim('✅ Run without --dry-run to execute'));
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

