/**
 * CipherClaw — Capability 7: Cross-Domain Correlation
 * Detects shared failure patterns across agent/CRM/content/infrastructure domains.
 */

import type {
  DebugSession, CrossDomainCorrelation, DebugDomain,
} from '../types/index.js';
import { uid } from './utils.js';

/** Detect correlations between errors across different domains. */
export function detectCrossDomainCorrelations(
  session: DebugSession,
  config: { correlationWindowMs: number },
): CrossDomainCorrelation[] {
  const correlations: CrossDomainCorrelation[] = [];
  const errors = session.errors;

  // Group errors by domain
  const domainErrors: Record<string, typeof errors> = {};
  for (const err of errors) {
    const d = err.domain;
    if (!domainErrors[d]) domainErrors[d] = [];
    domainErrors[d].push(err);
  }

  const domains = Object.keys(domainErrors) as DebugDomain[];
  if (domains.length < 2) return correlations;

  // Find temporal correlations between domain pairs
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domainA = domains[i];
      const domainB = domains[j];
      const errorsA = domainErrors[domainA];
      const errorsB = domainErrors[domainB];

      // Check for errors within the correlation window
      const correlated: { errorA: string; errorB: string; timeDelta: number }[] = [];

      for (const eA of errorsA) {
        for (const eB of errorsB) {
          const delta = Math.abs(eA.timestamp - eB.timestamp);
          if (delta <= config.correlationWindowMs) {
            correlated.push({ errorA: eA.id, errorB: eB.id, timeDelta: delta });
          }
        }
      }

      if (correlated.length > 0) {
        const sourceEvents = [
          ...errorsA.slice(0, 3).map(e => ({
            domain: domainA as DebugDomain,
            spanId: e.spanId ?? e.id,
            description: e.message,
          })),
          ...errorsB.slice(0, 3).map(e => ({
            domain: domainB as DebugDomain,
            spanId: e.spanId ?? e.id,
            description: e.message,
          })),
        ];

        const strength = Math.min(correlated.length / Math.max(errorsA.length, errorsB.length), 1);

        const correlation: CrossDomainCorrelation = {
          id: uid('corr'),
          timestamp: Date.now(),
          domains: [domainA, domainB],
          correlationType: 'temporal',
          strength,
          sourceEvents,
          description: `${correlated.length} correlated error(s) between ${domainA} and ${domainB} within ${config.correlationWindowMs}ms window`,
          suggestedAction: `Investigate shared root cause between ${domainA} and ${domainB} domains`,
        };

        correlations.push(correlation);
      }
    }
  }

  session.crossDomainCorrelations.push(...correlations);
  return correlations;
}

/** Get all correlations involving a specific domain. */
export function getCorrelationsForDomain(
  session: DebugSession,
  domain: DebugDomain,
): CrossDomainCorrelation[] {
  return session.crossDomainCorrelations.filter(c => c.domains.includes(domain));
}
