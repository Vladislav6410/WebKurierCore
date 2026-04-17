interface FormatOptions {
  showCitations: boolean;
  showMetadata: boolean;
  color: boolean;
  query?: string;
  duration?: number;
}

export class JsonFormatter {
  static format(response: any, options: FormatOptions): string {
    const payload: Record<string, unknown> = {
      text: response.text,
    };

    if (options.showCitations) {
      payload.citations = response.citations ?? [];
    }

    if (options.showMetadata) {
      payload.metadata = {
        ...(response.metadata ?? {}),
        durationMs: options.duration ?? response.metadata?.durationMs,
        query: options.query,
      };
    }

    return JSON.stringify(payload, null, 2);
  }
}
