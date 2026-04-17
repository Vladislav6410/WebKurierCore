import Table from 'cli-table3';

interface FormatOptions {
  showCitations: boolean;
  showMetadata: boolean;
  color: boolean;
  query?: string;
  duration?: number;
}

export class TableFormatter {
  static format(response: any, options: FormatOptions): string {
    const table = new Table({
      head: ['Field', 'Value'],
      wordWrap: true,
      colWidths: [18, 100],
    });

    table.push(
      ['Mode', response.metadata?.mode ?? 'unknown'],
      ['Model', response.metadata?.model ?? 'unknown'],
      ['Answer', response.text ?? ''],
    );

    if (typeof options.duration === 'number') {
      table.push(['Duration', `${options.duration}ms`]);
    }

    if (options.showMetadata && response.metadata?.tokensUsed !== undefined) {
      table.push(['Tokens', String(response.metadata.tokensUsed)]);
    }

    if (options.showCitations && Array.isArray(response.citations) && response.citations.length > 0) {
      const citations = response.citations
        .slice(0, 5)
        .map((c: any, i: number) => `[${i + 1}] ${c.title} — ${c.url}`)
        .join('\n');

      table.push(['Sources', citations]);
    }

    return table.toString();
  }
}