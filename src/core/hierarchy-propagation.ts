/**
 * CipherClaw — Capability 3: Hierarchical Debug Propagation
 * Routes debug events up/down/lateral through agent command structures.
 */

import type { DebugSession, HierarchyDebugEvent, DebugDomain } from '../types/index.js';
import { uid } from './utils.js';

/** Propagate a debug event through the agent hierarchy. */
export function propagateDebugEvent(
  session: DebugSession,
  event: {
    sourceAgentId: string;
    sourceLevel: number;
    targetAgentId: string;
    targetLevel: number;
    direction: 'up' | 'down' | 'lateral';
    eventType: 'error_escalation' | 'debug_request' | 'status_report' | 'intervention';
    payload: Record<string, unknown>;
    propagationPath: string[];
  },
): HierarchyDebugEvent {
  const hierarchyEvent: HierarchyDebugEvent = {
    id: uid('hev'),
    timestamp: Date.now(),
    sourceAgentId: event.sourceAgentId,
    sourceLevel: event.sourceLevel,
    targetAgentId: event.targetAgentId,
    targetLevel: event.targetLevel,
    direction: event.direction,
    eventType: event.eventType,
    payload: event.payload,
    propagationPath: event.propagationPath,
  };

  session.hierarchyEvents.push(hierarchyEvent);
  return hierarchyEvent;
}

/** Get all unacknowledged hierarchy events for a session. */
export function getUnacknowledgedEvents(session: DebugSession): HierarchyDebugEvent[] {
  return session.hierarchyEvents.filter(e => !(e.payload as Record<string, unknown>)['acknowledged']);
}

/** Acknowledge a hierarchy event. */
export function acknowledgeEvent(session: DebugSession, eventId: string): boolean {
  const event = session.hierarchyEvents.find(e => e.id === eventId);
  if (!event) return false;
  (event.payload as Record<string, unknown>)['acknowledged'] = true;
  return true;
}
