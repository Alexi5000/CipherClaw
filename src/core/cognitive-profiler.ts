/**
 * CipherClaw — Capability 2: Cognitive Fingerprinting
 * Builds 8-dimensional behavioral profiles for agents and detects drift over time.
 */

import type {
  Span, DebugSession, CognitiveFingerprint, CognitiveMetrics, Severity,
} from '../types/index.js';
import { mean, entropy, clamp } from './utils.js';

/** Get a stored cognitive fingerprint for an agent. */
export function getCognitiveFingerprint(
  session: DebugSession,
  agentId: string,
): CognitiveFingerprint | null {
  return session.cognitiveFingerprints.get(agentId) ?? null;
}

/** Detect cognitive drift for an agent. */
export function detectCognitiveDrift(
  session: DebugSession,
  agentId: string,
): { driftScore: number; driftDirection: string } | null {
  const fp = session.cognitiveFingerprints.get(agentId);
  if (!fp) return null;
  return { driftScore: fp.driftScore, driftDirection: fp.driftDirection };
}

/** Compute a cognitive fingerprint for an agent within a session. */
export function computeCognitiveFingerprint(
  session: DebugSession,
  agentId: string,
  cognitiveBaselines: Map<string, CognitiveMetrics[]>,
  config: { cognitiveBaselineSessions: number },
): CognitiveFingerprint {
  const agentSpans = session.traces
    .flatMap(t => t.spans)
    .filter(sp => sp.agentId === agentId);

  const latencies = agentSpans.map(sp => sp.durationMs);
  const toolCalls = agentSpans.filter(sp => sp.category === 'tool_call');
  const toolNames = toolCalls.map(sp => sp.name);
  const toolFreqs = new Map<string, number>();
  for (const name of toolNames) toolFreqs.set(name, (toolFreqs.get(name) ?? 0) + 1);

  const planSpans = agentSpans.filter(sp => sp.category === 'planning');
  const memorySpans = agentSpans.filter(sp => sp.category === 'memory');
  const errorSpans = agentSpans.filter(sp => sp.status === 'error' || sp.status === 'critical');
  const recoveredSpans = agentSpans.filter(sp => sp.attributes['recovered'] === true);
  const delegationSpans = agentSpans.filter(sp => sp.category === 'delegation');
  const escalationSpans = agentSpans.filter(sp => sp.category === 'escalation');

  const totalTokens = agentSpans.reduce((s, sp) => s + (sp.tokenUsage?.total ?? 0), 0);
  const reasoningTokens = agentSpans
    .filter(sp => sp.category === 'reasoning')
    .reduce((s, sp) => s + (sp.tokenUsage?.total ?? 0), 0);

  const metrics: CognitiveMetrics = {
    avgResponseLatencyMs: mean(latencies),
    toolSelectionEntropy: entropy(Array.from(toolFreqs.values())),
    planningDepth: planSpans.length > 0 ? mean(planSpans.map(sp => (sp.attributes['depth'] as number) ?? 1)) : 0,
    reasoningTokenRatio: totalTokens > 0 ? reasoningTokens / totalTokens : 0,
    errorRecoveryRate: errorSpans.length > 0 ? recoveredSpans.length / errorSpans.length : 1,
    memoryUtilization: agentSpans.length > 0 ? memorySpans.length / agentSpans.length : 0,
    delegationFrequency: agentSpans.length > 0 ? delegationSpans.length / agentSpans.length : 0,
    escalationRate: agentSpans.length > 0 ? escalationSpans.length / agentSpans.length : 0,
    decisionConsistency: computeDecisionConsistency(agentSpans),
    contextWindowUsage: computeContextWindowUsage(agentSpans),
  };

  const baselines = cognitiveBaselines.get(agentId) ?? [];
  const baseline = baselines.length >= config.cognitiveBaselineSessions
    ? averageMetrics(baselines)
    : null;

  const { driftScore, driftDirection, driftDetails } = baseline
    ? calculateDrift(metrics, baseline)
    : { driftScore: 0, driftDirection: 'unknown' as const, driftDetails: [] };

  baselines.push(metrics);
  if (baselines.length > config.cognitiveBaselineSessions * 2) baselines.shift();
  cognitiveBaselines.set(agentId, baselines);

  const fingerprint: CognitiveFingerprint = {
    agentId,
    sessionId: session.id,
    timestamp: Date.now(),
    metrics,
    baseline,
    driftScore,
    driftDirection,
    driftDetails,
  };

  session.cognitiveFingerprints.set(agentId, fingerprint);
  return fingerprint;
}

/** Measure how consistent tool selection sequences are. */
export function computeDecisionConsistency(spans: Span[]): number {
  const decisions = spans.filter(sp => sp.category === 'tool_call');
  if (decisions.length < 2) return 1;
  const toolSequences: string[] = [];
  for (let i = 0; i < decisions.length - 1; i++) {
    toolSequences.push(`${decisions[i].name}->${decisions[i + 1].name}`);
  }
  const uniqueSeqs = new Set(toolSequences).size;
  return 1 - (uniqueSeqs / toolSequences.length);
}

/** Estimate context window usage from token counts. */
export function computeContextWindowUsage(spans: Span[]): number {
  const maxTokens = spans
    .map(sp => sp.tokenUsage?.total ?? 0)
    .reduce((max, v) => Math.max(max, v), 0);
  return maxTokens / 128000;
}

/** Average a list of metrics into a single baseline. */
export function averageMetrics(metricsList: CognitiveMetrics[]): CognitiveMetrics {
  const keys = Object.keys(metricsList[0]) as (keyof CognitiveMetrics)[];
  const result: Record<string, number> = {};
  for (const key of keys) {
    result[key] = mean(metricsList.map(m => m[key]));
  }
  return result as unknown as CognitiveMetrics;
}

/** Calculate drift between current metrics and a baseline. */
export function calculateDrift(
  current: CognitiveMetrics,
  baseline: CognitiveMetrics,
): { driftScore: number; driftDirection: 'improving' | 'degrading' | 'stable'; driftDetails: CognitiveFingerprint['driftDetails'] } {
  const details: CognitiveFingerprint['driftDetails'] = [];
  const keys = Object.keys(current) as (keyof CognitiveMetrics)[];
  let totalDrift = 0;
  let improvingCount = 0;
  let degradingCount = 0;

  const higherIsBetter: Record<string, boolean> = {
    errorRecoveryRate: true, decisionConsistency: true,
    planningDepth: true, reasoningTokenRatio: true,
  };
  const lowerIsBetter: Record<string, boolean> = {
    avgResponseLatencyMs: true, escalationRate: true,
  };

  for (const key of keys) {
    const baseVal = baseline[key];
    const currVal = current[key];
    if (baseVal === 0) continue;

    const delta = (currVal - baseVal) / baseVal;
    const absDelta = Math.abs(delta) * 100;
    totalDrift += absDelta;

    let severity: Severity = 'info';
    if (absDelta > 50) severity = 'critical';
    else if (absDelta > 30) severity = 'high';
    else if (absDelta > 15) severity = 'medium';
    else if (absDelta > 5) severity = 'low';

    if (severity !== 'info') {
      details.push({ metric: key, delta: delta * 100, severity });
    }

    if (higherIsBetter[key]) {
      if (delta > 0.05) improvingCount++;
      else if (delta < -0.05) degradingCount++;
    } else if (lowerIsBetter[key]) {
      if (delta < -0.05) improvingCount++;
      else if (delta > 0.05) degradingCount++;
    }
  }

  const driftScore = clamp(totalDrift / keys.length, 0, 100);
  const driftDirection = improvingCount > degradingCount ? 'improving'
    : degradingCount > improvingCount ? 'degrading'
    : 'stable';

  return { driftScore, driftDirection, driftDetails: details };
}

/** Alias for named export compatibility. */
export const updateCognitiveFingerprint = computeCognitiveFingerprint;
