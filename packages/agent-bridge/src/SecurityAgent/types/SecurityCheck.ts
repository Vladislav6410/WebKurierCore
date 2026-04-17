export type SecurityMode = 'fast' | 'agentic';

export type SecurityVerdict =
  | 'safe'
  | 'suspicious'
  | 'malicious'
  | 'unknown';

export interface SecurityCheckConfig {
  mode?: SecurityMode;
}

export interface SecuritySource {
  title: string;
  url: string;
}

export interface SecurityFinding {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SecurityRecommendation {
  code: string;
  message: string;
}

export interface SecurityCheckResult {
  target: string;
  normalizedTarget: string;
  verdict: SecurityVerdict;
  riskScore: number;
  findings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
  sources: SecuritySource[];
  metadata: {
    mode: SecurityMode;
    model: string;
    durationMs: number;
    tokensUsed?: number;
    searchQueries?: string[];
    cache?: 'hit' | 'miss';
    checkedAt: string;
  };
}