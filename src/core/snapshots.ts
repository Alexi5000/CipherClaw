/**
 * CipherClaw — State Snapshots & Time-Travel Replay
 * Captures and replays debug state at any point in time.
 */

import type { DebugSession, StateSnapshot } from '../types/index.js';
import { uid } from './utils.js';
import { logSelfDebug, type SelfDebugLogEntry } from './self-debug.js';

/** Capture a state snapshot for a session. */
export function captureSnapshot(
  session: DebugSession,
  triggeredBy: string,
  breakpointId: string | null,
  spanId: string | null,
  maxSnapshots: number,
): StateSnapshot {
  if (session.snapshots.length >= maxSnapshots) {
    session.snapshots.shift();
  }

  const snapshot: StateSnapshot = {
    id: uid('snap'),
    sessionId: session.id,
    timestamp: Date.now(),
    triggeredBy,
    agentStates: {},
    memoryState: {},
    contextWindow: [],
    breakpointId,
    spanId,
  };

  session.snapshots.push(snapshot);
  return snapshot;
}

/** Capture a manual snapshot (user-triggered). */
export function captureManualSnapshot(
  session: DebugSession,
  maxSnapshots: number,
): StateSnapshot {
  return captureSnapshot(session, 'manual', null, null, maxSnapshots);
}

/** Get all snapshots for a session. */
export function getSnapshots(session: DebugSession): StateSnapshot[] {
  return [...session.snapshots];
}

/** Replay to a specific snapshot — pauses the session at that point. */
export function replayToSnapshot(
  session: DebugSession,
  snapshotId: string,
  selfDebugLog: SelfDebugLogEntry[],
): StateSnapshot | null {
  const snapshot = session.snapshots.find(sn => sn.id === snapshotId);
  if (!snapshot) return null;

  // Mark session as paused at this point
  session.status = 'paused';
  session.metadata['replayTarget'] = snapshotId;
  session.metadata['replayTimestamp'] = snapshot.timestamp;

  logSelfDebug(selfDebugLog, 'replay', `Replaying to snapshot ${snapshotId} at ${new Date(snapshot.timestamp).toISOString()}`);
  return snapshot;
}
