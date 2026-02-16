/**
 * CipherClaw — Error Classification
 * Classifies errors by module, severity, recoverability, and domain.
 */

import type {
  DebugSession, ClassifiedError, Span, ErrorModule, Severity, Recoverability,
} from '../types/index.js';
import { uid } from './utils.js';
import { ERROR_PATTERNS } from './patterns.js';

/** Classify an error message against known patterns. */
export function classifyError(
  session: DebugSession,
  message: string,
  span?: Partial<Span>,
): ClassifiedError {
  let module: ErrorModule = 'system';
  let severity: Severity = 'medium';
  let recoverability: Recoverability = 'retriable';
  let suggestedFix = 'Review error logs and retry operation';

  // Match against patterns
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(message)) {
      module = pattern.module;
      severity = pattern.severity;
      recoverability = pattern.recoverability;
      suggestedFix = pattern.suggestedFix;
      break;
    }
  }

  // Override with span category if available
  if (span?.category) {
    const categoryMap: Record<string, ErrorModule> = {
      'memory': 'memory', 'tool_call': 'tool', 'planning': 'planning',
      'delegation': 'hierarchy', 'escalation': 'hierarchy',
      'crm': 'crm', 'content': 'content', 'security': 'security',
    };
    if (categoryMap[span.category]) module = categoryMap[span.category];
  }

  const error: ClassifiedError = {
    id: uid('err'),
    timestamp: Date.now(),
    message,
    stack: null,
    module,
    severity,
    recoverability,
    domain: span?.domain ?? session.domain,
    agentId: span?.agentId ?? null,
    spanId: span?.id ?? null,
    rootCauseNodeId: null,
    suggestedFix,
    retryCount: 0,
    resolved: false,
  };

  session.errors.push(error);
  return error;
}

/** Get errors filtered by module. */
export function getErrorsByModule(
  session: DebugSession,
  module: ErrorModule,
): ClassifiedError[] {
  return session.errors.filter(e => e.module === module);
}

/** Get errors filtered by severity. */
export function getErrorsBySeverity(
  session: DebugSession,
  severity: Severity,
): ClassifiedError[] {
  return session.errors.filter(e => e.severity === severity);
}

/** Resolve an error. */
export function resolveError(
  session: DebugSession,
  errorId: string,
): boolean {
  const error = session.errors.find(e => e.id === errorId);
  if (!error) return false;
  error.resolved = true;
  return true;
}
