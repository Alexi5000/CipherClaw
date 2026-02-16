/**
 * CipherClaw — Capability 4: Multi-Tier Memory Debugging
 * Analyzes health across 5 cognitive memory tiers.
 */

import type {
  DebugSession, MemoryHealthReport, MemoryTier, MemoryTierHealth, MemoryIssue, Severity,
} from '../types/index.js';
import { clamp } from './utils.js';

/** The 5 cognitive memory tiers. */
export const MEMORY_TIERS: MemoryTier[] = [
  'working', 'short_term', 'episodic', 'semantic', 'archival',
];

/** Analyze memory health across all 5 tiers. */
export function analyzeMemoryHealth(
  session: DebugSession,
  memoryState: Record<MemoryTier, {
    items: unknown[];
    decayRates: number[];
    retrievalHits: number;
    retrievalMisses: number;
  }>,
): MemoryHealthReport {
  const issues: MemoryIssue[] = [];
  const tiers: Record<string, MemoryTierHealth> = {} as Record<string, MemoryTierHealth>;

  for (const tier of MEMORY_TIERS) {
    const store = memoryState[tier];
    if (!store) {
      tiers[tier] = {
        tier,
        itemCount: 0,
        avgDecayRate: 0,
        retrievalAccuracy: 0,
        promotionRate: 0,
        demotionRate: 0,
        staleItemCount: 0,
        coherenceScore: 100,
        health: 50,
      };
      issues.push({
        tier,
        type: 'underutilization',
        severity: 'low',
        description: `No ${tier} memory stores configured`,
        affectedItems: 0,
      });
      continue;
    }

    const itemCount = store.items.length;
    const avgDecayRate = store.decayRates.length > 0
      ? store.decayRates.reduce((s, d) => s + d, 0) / store.decayRates.length
      : 0;
    const totalRetrievals = store.retrievalHits + store.retrievalMisses;
    const retrievalAccuracy = totalRetrievals > 0 ? store.retrievalHits / totalRetrievals : 1;

    // Detect stale data
    const staleItemCount = store.decayRates.filter(d => d > 0.7).length;
    const staleRatio = itemCount > 0 ? staleItemCount / itemCount : 0;

    let health = 100;

    // Stale data penalty
    if (staleRatio > 0.3) {
      health -= 20;
      issues.push({
        tier,
        type: 'stale_data',
        severity: staleRatio > 0.5 ? 'high' : 'medium',
        description: `${(staleRatio * 100).toFixed(0)}% of ${tier} memory items have high decay rates`,
        affectedItems: staleItemCount,
      });
    }

    // Retrieval failure penalty
    if (store.retrievalMisses > 5 && retrievalAccuracy < 0.8) {
      health -= 15;
      issues.push({
        tier,
        type: 'retrieval_failure',
        severity: retrievalAccuracy < 0.5 ? 'high' : 'medium',
        description: `${tier} retrieval accuracy is ${(retrievalAccuracy * 100).toFixed(0)}% (${store.retrievalMisses} misses)`,
        affectedItems: store.retrievalMisses,
      });
    }

    // Decay anomaly
    if (avgDecayRate > 0.5) {
      health -= 10;
      issues.push({
        tier,
        type: 'decay_anomaly',
        severity: 'medium',
        description: `${tier} average decay rate is abnormally high (${avgDecayRate.toFixed(2)})`,
        affectedItems: itemCount,
      });
    }

    tiers[tier] = {
      tier,
      itemCount,
      avgDecayRate,
      retrievalAccuracy,
      promotionRate: 0,
      demotionRate: 0,
      staleItemCount,
      coherenceScore: clamp(100 - staleRatio * 50, 0, 100),
      health: clamp(health, 0, 100),
    };
  }

  const overallHealth = Object.values(tiers).reduce((s, t) => s + t.health, 0) / MEMORY_TIERS.length;

  const report: MemoryHealthReport = {
    timestamp: Date.now(),
    tiers: tiers as Record<MemoryTier, MemoryTierHealth>,
    overallHealth: clamp(overallHealth, 0, 100),
    issues,
    recommendations: generateMemoryRecommendations(tiers, issues),
  };

  session.memoryHealth = report;
  return report;
}

/** Generate actionable recommendations from memory health data. */
function generateMemoryRecommendations(
  tierHealth: Record<string, MemoryTierHealth>,
  issues: MemoryIssue[],
): string[] {
  const recs: string[] = [];

  for (const [, data] of Object.entries(tierHealth)) {
    if (data.health < 50) {
      recs.push(`Critical: ${data.tier} memory tier needs immediate attention`);
    } else if (data.health < 75) {
      recs.push(`Warning: ${data.tier} memory tier health is degraded`);
    }
  }

  if (issues.some(i => i.type === 'stale_data')) {
    recs.push('Run memory garbage collection to clear stale entries');
  }
  if (issues.some(i => i.type === 'retrieval_failure')) {
    recs.push('Check memory store connectivity and indexing');
  }
  if (issues.some(i => i.type === 'decay_anomaly')) {
    recs.push('Review memory decay rate configuration');
  }

  return recs;
}
