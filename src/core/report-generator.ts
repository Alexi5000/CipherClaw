/**
 * CipherClaw — Veronica Report Generation
 * Generates comprehensive debug reports with health scores and recommendations.
 */

import type {
  DebugSession, VeronicaDebugReport, DebugDomain, Severity, MemoryIssue,
} from '../types/index.js';
import { mean, clamp } from './utils.js';
import { getCausalRootCauses } from './causal-graph.js';

/** Generate a comprehensive debug report for a session. */
export function generateVeronicaReport(
  session: DebugSession,
  runFlowTests: (sessionId: string) => { total: number; passed: number; failed: number; coverage: number },
): VeronicaDebugReport {
  // Severity breakdown
  const severityBreakdown: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const err of session.errors) severityBreakdown[err.severity]++;

  // Domain breakdown
  const domainBreakdown: Record<string, { errors: number; anomalies: number; health: number }> = {};
  const allDomains: DebugDomain[] = ['agent', 'crm', 'content', 'memory', 'tool', 'hierarchy'];
  for (const domain of allDomains) {
    const domainErrors = session.errors.filter(e => e.domain === domain).length;
    const domainAnomalies = session.anomalies.filter(a => a.domain === domain).length;
    const health = 100 - (domainErrors * 5) - (domainAnomalies * 3);
    domainBreakdown[domain] = { errors: domainErrors, anomalies: domainAnomalies, health: clamp(health, 0, 100) };
  }

  // Health score calculation
  let healthScore = 100;
  healthScore -= severityBreakdown.critical * 15;
  healthScore -= severityBreakdown.high * 8;
  healthScore -= severityBreakdown.medium * 3;
  healthScore -= severityBreakdown.low * 1;
  healthScore -= session.anomalies.length * 2;
  healthScore -= session.anomalyCascades.length * 10;

  // Flow test coverage bonus/penalty
  const flowResults = runFlowTests(session.id);
  if (flowResults.total > 0) {
    const coverageBonus = flowResults.coverage * 20 - 10;
    healthScore += coverageBonus;
  }

  healthScore = clamp(healthScore, 0, 100);

  // Top issues
  const topIssues = session.errors
    .reduce((acc, err) => {
      const existing = acc.find(i => i.description === err.message);
      if (existing) { existing.count++; }
      else { acc.push({ description: err.message, severity: err.severity, domain: err.domain, count: 1 }); }
      return acc;
    }, [] as VeronicaDebugReport['topIssues'])
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Causal root causes
  const causalRootCauses = getCausalRootCauses(session).map(n => ({
    nodeId: n.id,
    description: `${n.operation} (${n.domain})`,
    probability: n.rootCauseProbability,
  }));

  // Cognitive alerts
  const cognitiveAlerts = Array.from(session.cognitiveFingerprints.values())
    .filter(f => f.driftScore > 15)
    .map(f => ({ agentId: f.agentId, driftScore: f.driftScore, direction: f.driftDirection }));

  // Soul alerts
  const soulAlerts = Array.from(session.soulIntegrity.values())
    .filter(r => r.overallScore < 80)
    .map(r => ({
      agentId: r.agentId,
      integrityScore: r.overallScore,
      driftDimensions: r.dimensions.filter(d => d.severity !== 'info').map(d => d.name),
    }));

  // Memory alerts
  const memoryAlerts: MemoryIssue[] = session.memoryHealth?.issues ?? [];

  // Recommendations
  const recommendations: string[] = [];
  if (severityBreakdown.critical > 0) recommendations.push(`Address ${severityBreakdown.critical} critical error(s) immediately`);
  if (session.anomalyCascades.length > 0) recommendations.push(`Investigate ${session.anomalyCascades.length} anomaly cascade(s)`);
  if (cognitiveAlerts.length > 0) recommendations.push(`Review cognitive drift in ${cognitiveAlerts.length} agent(s)`);
  if (soulAlerts.length > 0) recommendations.push(`Reinforce soul prompts for ${soulAlerts.length} agent(s)`);
  if (memoryAlerts.length > 0) recommendations.push(`Address ${memoryAlerts.length} memory health issue(s)`);
  if (session.predictions.filter(p => !p.resolved).length > 0) {
    recommendations.push(`${session.predictions.filter(p => !p.resolved).length} unresolved failure prediction(s) require attention`);
  }
  if (flowResults.coverage < 0.5) recommendations.push('Increase flow test coverage — currently below 50%');

  // Action items
  const actionItems: VeronicaDebugReport['actionItems'] = [];
  if (severityBreakdown.critical > 0) actionItems.push({ priority: 'critical', action: 'Fix critical errors', domain: 'all' });
  for (const cascade of session.anomalyCascades) {
    actionItems.push({ priority: cascade.severity, action: `Investigate cascade: ${cascade.description}`, domain: cascade.affectedDomains[0] ?? 'all' });
  }
  for (const pred of session.predictions.filter(p => !p.resolved)) {
    actionItems.push({ priority: 'high', action: `Prevent predicted failure: ${pred.predictedFailureType}`, domain: pred.domain });
  }

  const summary = healthScore >= 80
    ? `System is healthy (${healthScore}/100). ${session.errors.length} errors, ${session.anomalies.length} anomalies detected.`
    : healthScore >= 50
    ? `System needs attention (${healthScore}/100). ${severityBreakdown.critical + severityBreakdown.high} critical/high issues require action.`
    : `System is degraded (${healthScore}/100). Immediate intervention required. ${session.anomalyCascades.length} cascading failures detected.`;

  return {
    sessionId: session.id,
    generatedAt: Date.now(),
    healthScore,
    summary,
    severityBreakdown,
    domainBreakdown,
    topIssues,
    causalRootCauses,
    predictions: session.predictions.filter(p => !p.resolved),
    cognitiveAlerts,
    soulAlerts,
    memoryAlerts,
    flowTestResults: flowResults,
    recommendations,
    actionItems,
  };
}
