/**
 * CipherClaw — Capability 8: Self-Debugging Agent Loop
 * Recursive meta-debugging with self-repair and audit logging.
 */

import type { DebugSession, FailurePrediction } from '../types/index.js';

export interface SelfDebugLogEntry {
  timestamp: number;
  action: string;
  result: string;
}

export interface SelfDebugResult {
  healthy: boolean;
  issues: string[];
  actions: string[];
}

/** Run self-diagnostics on the engine state. */
export function selfDebug(
  sessions: Map<string, DebugSession>,
  predictionHistory: FailurePrediction[],
  selfDebugLog: SelfDebugLogEntry[],
): SelfDebugResult {
  const issues: string[] = [];
  const actions: string[] = [];

  // Check engine health
  if (sessions.size > 100) {
    issues.push(`High session count: ${sessions.size}`);
    actions.push('Prune completed sessions older than 24h');
  }

  // Check for stuck sessions
  for (const [id, session] of sessions) {
    if (session.status === 'hunting' && Date.now() - session.startedAt > 3600000) {
      issues.push(`Session ${id} has been hunting for >1 hour`);
      actions.push(`Force-complete session ${id}`);
    }
  }

  // Check prediction accuracy
  const resolvedPredictions = predictionHistory.filter(p => p.resolved);
  if (resolvedPredictions.length > 10) {
    const accuracy = resolvedPredictions.filter(p => p.confidence > 0.7).length / resolvedPredictions.length;
    if (accuracy < 0.5) {
      issues.push(`Prediction accuracy is low: ${(accuracy * 100).toFixed(1)}%`);
      actions.push('Recalibrate prediction thresholds');
    }
  }

  // Check self-debug log for repeated errors
  const recentLogs = selfDebugLog.filter(l => Date.now() - l.timestamp < 300000);
  const errorLogs = recentLogs.filter(l => l.result.includes('error') || l.result.includes('fail'));
  if (errorLogs.length > 5) {
    issues.push(`${errorLogs.length} self-debug errors in last 5 minutes`);
    actions.push('Review self-debug log for recurring patterns');
  }

  const healthy = issues.length === 0;
  logSelfDebug(selfDebugLog, 'selfDebug', healthy ? 'All systems nominal' : `${issues.length} issues found`);

  return { healthy, issues, actions };
}

/** Add an entry to the self-debug audit log. */
export function logSelfDebug(
  selfDebugLog: SelfDebugLogEntry[],
  action: string,
  result: string,
): void {
  selfDebugLog.push({ timestamp: Date.now(), action, result });
  // Keep last 1000 entries
  if (selfDebugLog.length > 1000) selfDebugLog.shift();
}

/** Get a copy of the self-debug audit log. */
export function getSelfDebugLog(selfDebugLog: SelfDebugLogEntry[]): SelfDebugLogEntry[] {
  return [...selfDebugLog];
}
