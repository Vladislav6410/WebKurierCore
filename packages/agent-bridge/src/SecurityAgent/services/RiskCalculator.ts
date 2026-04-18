import type {
  SecurityCheckResult,
  SecurityFinding,
  SecurityRecommendation,
  SecuritySource,
  SecurityVerdict,
  SecurityMode,
} from '../types/SecurityCheck.js';

interface RiskCalculatorInput {
  target: string;
  normalizedTarget: string;
  mode: SecurityMode;
  text: string;
  sources: SecuritySource[];
  model?: string;
  tokensUsed?: number;
  searchQueries?: string[];
  durationMs: number;
}

export class RiskCalculator {
  static calculate(input: RiskCalculatorInput): SecurityCheckResult {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];
    let riskScore = 0;

    const hasMalicious =
      /(malicious|phishing|malware|scam|fraud|blacklist)/i.test(input.text);
    const hasSuspicious =
      /(suspicious|unverified|low reputation|recently registered|abuse)/i.test(input.text);
    const hasSafeSignals =
      /(safe|trusted|benign|no known malicious activity)/i.test(input.text);

    if (hasMalicious) {
      riskScore += 80;
      findings.push({
        code: 'MALICIOUS_SIGNAL',
        message: 'Multiple threat indicators were found in reviewed sources',
        severity: 'high',
      });
      recommendations.push({ code: 'AVOID_TARGET', message: 'Do not open or share this target' });
      recommendations.push({ code: 'MANUAL_REVIEW', message: 'Escalate for manual security review' });
    } else if (hasSuspicious) {
      riskScore += 45;
      findings.push({
        code: 'SUSPICIOUS_SIGNAL',
        message: 'Reputation concerns or warning indicators were detected',
        severity: 'medium',
      });
      recommendations.push({ code: 'VERIFY_MANUALLY', message: 'Use caution and verify the target manually' });
    } else if (hasSafeSignals) {
      findings.push({
        code: 'NO_STRONG_THREAT_SIGNALS',
        message: 'No strong threat indicators were found in reviewed sources',
        severity: 'low',
      });
      recommendations.push({ code: 'MONITOR', message: 'Continue to monitor if the target is business-critical' });
    } else {
      riskScore += 15;
      findings.push({
        code: 'INSUFFICIENT_EVIDENCE',
        message: 'Insufficient evidence for a strong verdict',
        severity: 'low',
      });
      recommendations.push({ code: 'GATHER_MORE_DATA', message: 'Collect additional intelligence before trusting the target' });
    }

    return {
      target: input.target,
      normalizedTarget: input.normalizedTarget,
      verdict: this.resolveVerdict(riskScore),
      riskScore,
      findings,
      recommendations,
      sources: input.sources,
      metadata: {
        mode: input.mode,
        model: input.model ?? 'unknown',
        durationMs: input.durationMs,
        tokensUsed: input.tokensUsed,
        searchQueries: input.searchQueries ?? [],
        cache: 'miss',
        checkedAt: new Date().toISOString(),
      },
    };
  }

  private static resolveVerdict(riskScore: number): SecurityVerdict {
    const blockThreshold = Number(process.env.SECURITY_BLOCK_THRESHOLD ?? 75);
    if (riskScore >= blockThreshold) return 'malicious';
    if (riskScore >= 40) return 'suspicious';
    if (riskScore > 0) return 'unknown';
    return 'safe';
  }
}
