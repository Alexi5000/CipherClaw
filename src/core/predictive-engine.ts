/**
 * CipherClaw — Capability 5: Predictive Failure Engine
 * Pattern-based failure prediction before occurrence.
 */

import type {
  DebugSession, FailurePrediction, FailurePattern, Span, DebugDomain,
} from '../types/index.js';
import { uid } from './utils.js';
import { PREDICTION_PATTERNS } from './patterns.js';

/** Predict potential failures based on observed spans. */
export function predictFailures(
  session: DebugSession,
  predictionHistory: FailurePrediction[],
): FailurePrediction[] {
  const newPredictions: FailurePrediction[] = [];
  const allSpans = session.traces.flatMap(t => t.spans);

  for (const pattern of PREDICTION_PATTERNS) {
    if (matchesPredictionPattern(pattern, allSpans, session)) {
      // Don't duplicate active predictions of the same type
      const existing = session.predictions.find(
        p => p.predictedFailureType === pattern.name && !p.resolved,
      );
      if (existing) continue;

      const prediction: FailurePrediction = {
        id: uid('pred'),
        timestamp: Date.now(),
        predictedFailureType: pattern.name,
        confidence: pattern.avgConfidence,
        timeToFailureMs: pattern.avgTimeToFailure,
        evidenceSpanIds: allSpans.slice(-5).map(s => s.id),
        suggestedAction: pattern.description,
        domain: session.domain,
        agentId: session.targetAgentId,
        pattern,
        resolved: false,
      };

      session.predictions.push(prediction);
      predictionHistory.push(prediction);
      newPredictions.push(prediction);
    }
  }

  return newPredictions;
}

/** Check if a prediction pattern matches the current session state. */
function matchesPredictionPattern(
  pattern: FailurePattern,
  spans: Span[],
  session: DebugSession,
): boolean {
  // Check each indicator against current metrics
  let matchScore = 0;
  let totalWeight = 0;

  for (const indicator of pattern.indicators) {
    totalWeight += indicator.weight;

    switch (indicator.metric) {
      case 'span_latency_trend':
      case 'avg_latency_ratio': {
        const durations = spans.map(s => s.durationMs);
        if (durations.length >= 3) {
          const recent = durations.slice(-3);
          const isIncreasing = recent.every((v, i) => i === 0 || v > recent[i - 1]);
          if (isIncreasing) matchScore += indicator.weight;
        }
        break;
      }
      case 'error_rate_derivative': {
        const errorRate = spans.filter(s => s.status === 'error' || s.status === 'critical').length / Math.max(spans.length, 1);
        if (errorRate > indicator.threshold) matchScore += indicator.weight;
        break;
      }
      default:
        break;
    }
  }

  return totalWeight > 0 && matchScore / totalWeight > 0.5;
}

/** Resolve a prediction (mark whether it was accurate). */
export function resolvePrediction(
  session: DebugSession,
  predictionId: string,
  wasAccurate: boolean,
): boolean {
  const prediction = session.predictions.find(p => p.id === predictionId);
  if (!prediction) return false;

  prediction.resolved = true;
  return true;
}

/** Get all active (unresolved) predictions for a session. */
export function getActivePredictions(session: DebugSession): FailurePrediction[] {
  return session.predictions.filter(p => !p.resolved);
}

/** Calculate prediction accuracy from history. */
export function getPredictionAccuracy(history: FailurePrediction[]): number {
  const resolved = history.filter(p => p.resolved);
  if (resolved.length === 0) return 0;
  return resolved.filter(p => p.confidence > 0.7).length / resolved.length;
}
