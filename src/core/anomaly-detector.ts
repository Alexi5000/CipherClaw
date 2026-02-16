/**
 * CipherClaw — Capability 10: Temporal Anomaly Cascade Detection
 * Z-score-based anomaly detection with cascade grouping.
 */

import type {
  DebugSession, Anomaly, AnomalyCascade, DebugDomain,
} from '../types/index.js';
import { uid, mean, stddev } from './utils.js';

/** Detect latency spikes and error bursts in a set of spans. */
export function detectAnomalies(
  session: DebugSession,
  spans: { id: string; name: string; durationMs: number }[],
  config: { anomalyThresholdStdDev: number; cascadeWindowMs: number },
): Anomaly[] {
  const newAnomalies: Anomaly[] = [];
  const durations = spans.map(sp => sp.durationMs);
  const m = mean(durations);
  const sd = stddev(durations);

  if (sd === 0) return [];

  // Latency spike detection
  for (const span of spans) {
    const zScore = Math.abs((span.durationMs - m) / sd);
    if (zScore > config.anomalyThresholdStdDev) {
      newAnomalies.push({
        id: uid('anom'),
        type: 'latency_spike',
        severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
        timestamp: Date.now(),
        domain: session.domain,
        agentId: null,
        spanId: span.id,
        description: `Latency spike: ${span.name} took ${span.durationMs}ms (${zScore.toFixed(1)}σ from mean ${m.toFixed(0)}ms)`,
        value: span.durationMs,
        expectedRange: { min: m - sd * 2, max: m + sd * 2 },
        cascadeId: null,
        cascadePosition: 0,
      });
    }
  }

  // Error burst detection
  const recentErrors = session.errors.filter(e => Date.now() - e.timestamp < 60000);
  if (recentErrors.length > 5) {
    newAnomalies.push({
      id: uid('anom'),
      type: 'error_burst',
      severity: recentErrors.length > 20 ? 'critical' : recentErrors.length > 10 ? 'high' : 'medium',
      timestamp: Date.now(),
      domain: session.domain,
      agentId: null,
      spanId: null,
      description: `Error burst: ${recentErrors.length} errors in last 60 seconds`,
      value: recentErrors.length,
      expectedRange: { min: 0, max: 5 },
      cascadeId: null,
      cascadePosition: 0,
    });
  }

  // Add to session and detect cascades
  session.anomalies.push(...newAnomalies);
  detectCascades(session, config);

  return newAnomalies;
}

/** Group temporally proximate anomalies into cascades. */
export function detectCascades(
  session: DebugSession,
  config: { cascadeWindowMs: number },
): void {
  const recentAnomalies = session.anomalies.filter(
    a => !a.cascadeId && Date.now() - a.timestamp < config.cascadeWindowMs,
  );

  if (recentAnomalies.length < 3) return;

  // Group by time proximity
  const sorted = [...recentAnomalies].sort((a, b) => a.timestamp - b.timestamp);
  const cascadeGroups: Anomaly[][] = [];
  let currentGroup: Anomaly[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp - sorted[i - 1].timestamp < config.cascadeWindowMs / 3) {
      currentGroup.push(sorted[i]);
    } else {
      if (currentGroup.length >= 3) cascadeGroups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  if (currentGroup.length >= 3) cascadeGroups.push(currentGroup);

  // Create cascade records
  for (const group of cascadeGroups) {
    const cascadeId = uid('casc');
    const cascade: AnomalyCascade = {
      id: cascadeId,
      rootAnomalyId: group[0].id,
      anomalyIds: group.map(a => a.id),
      startTime: group[0].timestamp,
      endTime: group[group.length - 1].timestamp,
      affectedDomains: [...new Set(group.map(a => a.domain))] as DebugDomain[],
      affectedAgents: [...new Set(group.filter(a => a.agentId).map(a => a.agentId!))] as string[],
      severity: group.some(a => a.severity === 'critical') ? 'critical'
        : group.some(a => a.severity === 'high') ? 'high' : 'medium',
      description: `Anomaly cascade: ${group.length} anomalies over ${group[group.length - 1].timestamp - group[0].timestamp}ms`,
    };

    // Mark anomalies as part of cascade
    for (let i = 0; i < group.length; i++) {
      group[i].cascadeId = cascadeId;
      group[i].cascadePosition = i;
    }

    session.anomalyCascades.push(cascade);
  }
}

/** Get all anomalies for a specific domain. */
export function getAnomaliesByDomain(
  session: DebugSession,
  domain: DebugDomain,
): Anomaly[] {
  return session.anomalies.filter(a => a.domain === domain);
}

/** Get all cascades for a session. */
export function getCascades(session: DebugSession): AnomalyCascade[] {
  return [...session.anomalyCascades];
}
