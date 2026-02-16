/**
 * CipherClaw — Breakpoint System
 * 11 breakpoint types with conditional expressions and state snapshots.
 */

import type {
  DebugSession, Breakpoint, BreakpointType, Span, StateSnapshot,
} from '../types/index.js';
import { uid } from './utils.js';

/** Add a breakpoint to a session. */
export function addBreakpoint(
  session: DebugSession,
  type: BreakpointType,
  condition?: string,
  metadata?: Record<string, unknown>,
): Breakpoint {
  const bp: Breakpoint = {
    id: uid('bp'),
    type,
    enabled: true,
    condition: condition ?? null,
    hitCount: 0,
    maxHits: null,
    createdAt: Date.now(),
    lastHitAt: null,
    metadata: metadata ?? {},
  };

  session.breakpoints.push(bp);
  return bp;
}

/** Remove a breakpoint from a session. */
export function removeBreakpoint(session: DebugSession, breakpointId: string): void {
  session.breakpoints = session.breakpoints.filter(bp => bp.id !== breakpointId);
}

/** Toggle a breakpoint on/off. */
export function toggleBreakpoint(session: DebugSession, breakpointId: string): void {
  const bp = session.breakpoints.find(b => b.id === breakpointId);
  if (bp) bp.enabled = !bp.enabled;
}

/** Check all breakpoints against a span, capturing snapshots on hits. */
export function checkBreakpoints(
  session: DebugSession,
  span: Span,
  captureSnapshot: (session: DebugSession, triggeredBy: string, breakpointId: string | null, spanId: string | null) => StateSnapshot,
): void {
  for (const bp of session.breakpoints) {
    if (!bp.enabled) continue;
    if (bp.maxHits !== null && bp.hitCount >= bp.maxHits) continue;

    let hit = false;
    switch (bp.type) {
      case 'on_error':
        hit = span.status === 'error' || span.status === 'critical';
        break;
      case 'on_tool_call':
        hit = span.category === 'tool_call';
        break;
      case 'on_span_category':
        hit = bp.metadata['category'] === span.category;
        break;
      case 'on_agent':
        hit = bp.metadata['agentId'] === span.agentId;
        break;
      case 'on_memory_op':
        hit = span.category === 'memory';
        break;
      case 'on_latency':
        hit = span.durationMs > ((bp.metadata['thresholdMs'] as number) ?? 5000);
        break;
      case 'on_cost_threshold':
        hit = (span.cost ?? 0) > ((bp.metadata['thresholdCost'] as number) ?? 0.1);
        break;
      case 'on_token_threshold':
        hit = (span.tokenUsage?.total ?? 0) > ((bp.metadata['thresholdTokens'] as number) ?? 10000);
        break;
      case 'on_hierarchy_event':
        hit = span.category === 'delegation' || span.category === 'escalation';
        break;
      case 'conditional':
        if (bp.condition) {
          try {
            const fn = new Function('span', 'session', `return ${bp.condition}`);
            hit = !!fn(span, session);
          } catch { hit = false; }
        }
        break;
    }

    if (hit) {
      bp.hitCount++;
      bp.lastHitAt = Date.now();
      captureSnapshot(session, `breakpoint:${bp.type}`, bp.id, span.id);
    }
  }
}
