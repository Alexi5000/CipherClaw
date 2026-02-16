/**
 * CipherClaw — Capability 6: Soul Integrity Monitoring
 * Verifies personality and value adherence for agents with soul prompts.
 */

import type {
  DebugSession, SoulIntegrityReport, SoulDimension, SoulDriftEvent,
  Span, Severity,
} from '../types/index.js';
import { clamp } from './utils.js';

/** Check soul integrity for an agent by analyzing its behavior against its soul definition. */
export function checkSoulIntegrity(
  session: DebugSession,
  agentId: string,
  soulDefinition: {
    personality: string[];
    values: string[];
    style: string;
  },
  behavior: {
    responses: string[];
    decisions: string[];
    tone: string;
  },
): SoulIntegrityReport {
  const dimensions: SoulDimension[] = [];
  const driftEvents: SoulDriftEvent[] = [];

  // Check personality adherence
  const personalityScore = analyzePersonalityAdherence(soulDefinition.personality, behavior);
  dimensions.push({
    name: 'personality',
    baselineValue: 100,
    currentValue: personalityScore,
    drift: 100 - personalityScore,
    severity: scoreSeverity(personalityScore),
  });
  if (personalityScore < 80) {
    driftEvents.push({
      timestamp: Date.now(),
      dimension: 'personality',
      previousValue: 100,
      newValue: personalityScore,
      trigger: 'behavioral_analysis',
      spanId: null,
    });
  }

  // Check value alignment
  const valueScore = analyzeValueAlignment(soulDefinition.values, behavior);
  dimensions.push({
    name: 'values',
    baselineValue: 100,
    currentValue: valueScore,
    drift: 100 - valueScore,
    severity: scoreSeverity(valueScore),
  });
  if (valueScore < 80) {
    driftEvents.push({
      timestamp: Date.now(),
      dimension: 'values',
      previousValue: 100,
      newValue: valueScore,
      trigger: 'value_alignment_check',
      spanId: null,
    });
  }

  // Check communication style
  const styleScore = analyzeStyleAdherence(soulDefinition.style, behavior.tone);
  dimensions.push({
    name: 'style',
    baselineValue: 100,
    currentValue: styleScore,
    drift: 100 - styleScore,
    severity: scoreSeverity(styleScore),
  });

  const overallScore = dimensions.reduce((s, d) => s + d.currentValue, 0) / dimensions.length;

  const report: SoulIntegrityReport = {
    agentId,
    timestamp: Date.now(),
    overallScore: clamp(overallScore, 0, 100),
    dimensions,
    driftEvents,
    recommendations: generateSoulRecommendations(dimensions),
  };

  session.soulIntegrity.set(agentId, report);
  return report;
}

/** Analyze personality trait adherence from behavior. */
function analyzePersonalityAdherence(
  personality: string[],
  behavior: { responses: string[]; decisions: string[]; tone: string },
): number {
  if (personality.length === 0) return 100;

  let score = 100;

  // Check if responses contain error/system messages (indicates broken personality)
  const errorResponses = behavior.responses.filter(r =>
    /ERROR|FAILURE|UNAUTHORIZED|NULL|SYSTEM/i.test(r),
  );
  score -= errorResponses.length * 20;

  // Check if decisions are negative
  const negativeDecisions = behavior.decisions.filter(d =>
    /ignored|bypassed|crashed|failed|random/i.test(d),
  );
  score -= negativeDecisions.length * 15;

  // Check tone mismatch
  if (behavior.tone === 'hostile') score -= 30;

  return clamp(score, 0, 100);
}

/** Analyze value alignment from behavior. */
function analyzeValueAlignment(
  values: string[],
  behavior: { responses: string[]; decisions: string[]; tone: string },
): number {
  if (values.length === 0) return 100;

  let score = 100;

  // Check for value-violating decisions
  const violations = behavior.decisions.filter(d =>
    /ignored|bypassed|crashed|failed|random/i.test(d),
  );
  score -= violations.length * 15;

  // Check for error-like responses
  const errorResponses = behavior.responses.filter(r =>
    /ERROR|FAILURE|UNAUTHORIZED|NULL/i.test(r),
  );
  score -= errorResponses.length * 10;

  return clamp(score, 0, 100);
}

/** Analyze communication style adherence. */
function analyzeStyleAdherence(expectedStyle: string, actualTone: string): number {
  if (!expectedStyle) return 100;
  if (expectedStyle === actualTone) return 100;

  // Hostile tone is always a major deviation
  if (actualTone === 'hostile') return 30;

  // Different but not hostile
  return 70;
}

/** Convert a score to a severity level. */
function scoreSeverity(score: number): Severity {
  if (score >= 90) return 'info';
  if (score >= 75) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

/** Generate recommendations based on soul integrity dimensions. */
function generateSoulRecommendations(dimensions: SoulDimension[]): string[] {
  const recs: string[] = [];

  for (const dim of dimensions) {
    if (dim.currentValue < 60) {
      recs.push(`Critical: Reinforce ${dim.name} in soul prompt — score is ${dim.currentValue.toFixed(0)}%`);
    } else if (dim.currentValue < 80) {
      recs.push(`Review ${dim.name} adherence — mild drift detected (${dim.currentValue.toFixed(0)}%)`);
    }
  }

  return recs;
}
