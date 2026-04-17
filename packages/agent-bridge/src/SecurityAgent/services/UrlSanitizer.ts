export interface SanitizedTarget {
  original: string;
  normalizedTarget: string;
  hostname: string;
  scheme?: 'http' | 'https';
}

export class UrlSanitizer {
  static sanitize(input: string): SanitizedTarget {
    const original = String(input ?? '').trim();

    if (!original) {
      throw new Error('Target is required');
    }

    if (original.length > 2048) {
      throw new Error('Target exceeds maximum length');
    }

    if (/^(file|ftp|gopher):\/\//i.test(original)) {
      throw new Error('Unsupported URL scheme');
    }

    const candidate = /^https?:\/\//i.test(original)
      ? original
      : `https://${original}`;

    let parsed: URL;

    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error('Invalid URL or domain');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http and https targets are supported');
    }

    if (!parsed.hostname) {
      throw new Error('Target hostname is missing');
    }

    const hostname = parsed.hostname
      .trim()
      .toLowerCase()
      .replace(/\.$/, '');

    if (!isSafeHostname(hostname)) {
      throw new Error('Target contains unsupported hostname characters');
    }

    return {
      original,
      normalizedTarget: hostname,
      hostname,
      scheme: parsed.protocol === 'https:' ? 'https' : 'http',
    };
  }
}

function isSafeHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) {
    return false;
  }

  return /^[a-z0-9.-]+$/i.test(hostname);
}