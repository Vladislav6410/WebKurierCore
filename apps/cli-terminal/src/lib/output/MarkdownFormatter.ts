interface FormatOptions {
  showCitations: boolean;
  showMetadata: boolean;
  color: boolean;
  query?: string;
  duration?: number;
}

export class MarkdownFormatter {
  static format(response: any, options: FormatOptions): string {
    const lines: string[] = [];

    lines.push('# WebKurier Search Result');
    lines.push('');

    if (options.query) {
      lines.push(`**Query:** ${options.query}`);
      lines.push('');
    }

    lines.push(`**Mode:** ${response.metadata?.mode ?? 'unknown'}`);
    lines.push(`**Model:** ${response.metadata?.model ?? 'unknown'}`);

    if (typeof options.duration === 'number') {
      lines.push(`**Duration:** ${options.duration}ms`);
    }

    lines.push('');
    lines.push('## Answer');
    lines.push('');
    lines.push(response.text ?? '');
    lines.push('');

    if (options.showCitations && Array.isArray(response.citations) && response.citations.length > 0) {
      lines.push('## Sources');
      lines.push('');

      response.citations.forEach((cite: any, index: number) => {
        lines.push(`${index + 1}. [${cite.title}](${cite.url})`);
      });

      lines.push('');
    }

    if (options.showMetadata) {
      lines.push('## Metadata');
      lines.push('');
      lines.push(`- Mode: ${response.metadata?.mode ?? 'unknown'}`);
      lines.push(`- Model: ${response.metadata?.model ?? 'unknown'}`);

      if (response.metadata?.tokensUsed !== undefined) {
        lines.push(`- Tokens: ${response.metadata.tokensUsed}`);
      }

      if (response.metadata?.searchQueries?.length) {
        lines.push(`- Sub-queries: ${response.metadata.searchQueries.join(', ')}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}