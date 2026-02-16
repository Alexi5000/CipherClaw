/**
 * CipherClaw — OpenClaw Adapter
 * Provides a standardized interface for integrating CipherClaw with any
 * OpenClaw-compatible agent orchestration system.
 *
 * Copyright 2026 ClawLI.AI / CipherClaw
 * Licensed under Apache 2.0
 */

import { CipherClawEngine } from '../core/engine.js';
import type {
  DebugDomain, Span, Trace, DebugSession, VeronicaDebugReport,
  CausalGraph, CognitiveFingerprint, MemoryHealthReport,
  SoulIntegrityReport, FailurePrediction, CrossDomainCorrelation,
  Anomaly, AnomalyCascade, FlowTest, ClassifiedError,
  Breakpoint, BreakpointType, StateSnapshot,
  CipherClawConfig, OpenClawEvent, MemoryTier,
} from '../types/index.js';
import { CIPHERCLAW_MANIFEST } from './manifest.js';

// ═══════════════════════════════════════════════════════════════
// EVENT EMITTER INTERFACE
// ═══════════════════════════════════════════════════════════════

export type EventHandler = (event: OpenClawEvent) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: OpenClawEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(event); } catch (e) { console.error('[CipherClaw] Event handler error:', e); }
      }
    }
    // Also emit to wildcard listeners
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try { handler(event); } catch (e) { console.error('[CipherClaw] Wildcard handler error:', e); }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW OPENCLAW ADAPTER
// ═══════════════════════════════════════════════════════════════

export class CipherClawAdapter {
  private engine: CipherClawEngine;
  private eventBus: EventBus;
  private activeSessionId: string | null = null;

  constructor(config?: Partial<CipherClawConfig>) {
    this.engine = new CipherClawEngine(config);
    this.eventBus = new EventBus();
  }

  // ─────────────────────────────────────────────────────────
  // MANIFEST
  // ─────────────────────────────────────────────────────────

  getManifest() {
    return CIPHERCLAW_MANIFEST;
  }

  // ─────────────────────────────────────────────────────────
  // SESSION LIFECYCLE
  // ─────────────────────────────────────────────────────────

  startSession(opts?: { domain?: DebugDomain; targetAgentId?: string }): DebugSession {
    const session = this.engine.startSession(opts);
    this.activeSessionId = session.id;
    this.eventBus.emit({
      id: `evt_${Date.now()}`,
      type: 'session-started',
      source: 'cipherclaw-phantom',
      target: null,
      timestamp: Date.now(),
      payload: { sessionId: session.id, domain: session.domain },
    });
    return session;
  }

  completeSession(sessionId?: string): DebugSession | undefined {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return undefined;
    const session = this.engine.completeSession(id);
    if (session) {
      this.eventBus.emit({
        id: `evt_${Date.now()}`,
        type: 'session-completed',
        source: 'cipherclaw-phantom',
        target: null,
        timestamp: Date.now(),
        payload: { sessionId: session.id, healthScore: session.veronicaReport?.healthScore ?? 0 },
      });
    }
    return session;
  }

  getSession(sessionId?: string): DebugSession | undefined {
    return this.engine.getSession(sessionId ?? this.activeSessionId ?? '');
  }

  getAllSessions(): DebugSession[] {
    return this.engine.getAllSessions();
  }

  pauseSession(sessionId?: string): void {
    this.engine.pauseSession(sessionId ?? this.activeSessionId ?? '');
  }

  resumeSession(sessionId?: string): void {
    this.engine.resumeSession(sessionId ?? this.activeSessionId ?? '');
  }

  // ─────────────────────────────────────────────────────────
  // TRACE INGESTION (OpenClaw Event Listener)
  // ─────────────────────────────────────────────────────────

  ingestTrace(trace: Trace, sessionId?: string): void {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return;
    this.engine.ingestTrace(id, trace);
    this.eventBus.emit({
      id: `evt_${Date.now()}`,
      type: 'trace-ingested',
      source: 'cipherclaw-trace-analyst',
      target: null,
      timestamp: Date.now(),
      payload: { traceId: trace.id, spans: trace.spans.length },
    });
  }

  ingestSpan(span: Span, sessionId?: string): void {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return;
    this.engine.ingestSpan(id, span);
  }

  // ─────────────────────────────────────────────────────────
  // ERROR CLASSIFICATION
  // ─────────────────────────────────────────────────────────

  classifyError(message: string, span?: Partial<Span>, sessionId?: string): ClassifiedError {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    const error = this.engine.classifyError(id, message, span);
    this.eventBus.emit({
      id: `evt_${Date.now()}`,
      type: 'error-classified',
      source: 'cipherclaw-error-classifier',
      target: null,
      timestamp: Date.now(),
      payload: { errorId: error.id, module: error.module, severity: error.severity },
    });
    return error;
  }

  // ─────────────────────────────────────────────────────────
  // CAUSAL ANALYSIS
  // ─────────────────────────────────────────────────────────

  getCausalGraph(sessionId?: string): CausalGraph | null {
    return this.engine.getCausalGraph(sessionId ?? this.activeSessionId ?? '');
  }

  getRootCauses(sessionId?: string) {
    return this.engine.getRootCauses(sessionId ?? this.activeSessionId ?? '');
  }

  // ─────────────────────────────────────────────────────────
  // COGNITIVE FINGERPRINTING
  // ─────────────────────────────────────────────────────────

  computeCognitiveFingerprint(agentId: string, sessionId?: string): CognitiveFingerprint {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    const fp = this.engine.computeCognitiveFingerprint(id, agentId);
    if (fp.driftScore > 15) {
      this.eventBus.emit({
        id: `evt_${Date.now()}`,
        type: 'cognitive-drift-detected',
        source: 'cipherclaw-cognitive-profiler',
        target: agentId,
        timestamp: Date.now(),
        payload: { agentId, driftScore: fp.driftScore },
      });
    }
    return fp;
  }

  // ─────────────────────────────────────────────────────────
  // SOUL INTEGRITY
  // ─────────────────────────────────────────────────────────

  analyzeSoulIntegrity(
    agentId: string,
    soulPrompt: { personality: string[]; values: string[]; style: string },
    observedBehavior: { responses: string[]; decisions: string[]; tone: string },
    sessionId?: string,
  ): SoulIntegrityReport {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    const report = this.engine.analyzeSoulIntegrity(id, agentId, soulPrompt, observedBehavior);
    if (report.overallScore < 80) {
      this.eventBus.emit({
        id: `evt_${Date.now()}`,
        type: 'soul-drift-detected',
        source: 'cipherclaw-cognitive-profiler',
        target: agentId,
        timestamp: Date.now(),
        payload: { agentId, driftScore: 100 - report.overallScore },
      });
    }
    return report;
  }

  // ─────────────────────────────────────────────────────────
  // MEMORY HEALTH
  // ─────────────────────────────────────────────────────────

  analyzeMemoryHealth(
    memoryState: Record<MemoryTier, { items: unknown[]; decayRates: number[]; retrievalHits: number; retrievalMisses: number }>,
    sessionId?: string,
  ): MemoryHealthReport {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    return this.engine.analyzeMemoryHealth(id, memoryState);
  }

  // ─────────────────────────────────────────────────────────
  // ANOMALY DETECTION
  // ─────────────────────────────────────────────────────────

  detectAnomalies(
    spans: { id: string; name: string; durationMs: number }[],
    sessionId?: string,
  ): Anomaly[] {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return [];
    const anomalies = this.engine.detectAnomalies(id, spans);
    for (const anomaly of anomalies) {
      this.eventBus.emit({
        id: `evt_${Date.now()}`,
        type: 'anomaly-detected',
        source: 'cipherclaw-trace-analyst',
        target: null,
        timestamp: Date.now(),
        payload: { anomalyId: anomaly.id, type: anomaly.type, severity: anomaly.severity },
      });
    }
    return anomalies;
  }

  // ─────────────────────────────────────────────────────────
  // PREDICTIONS
  // ─────────────────────────────────────────────────────────

  getPredictions(sessionId?: string): FailurePrediction[] {
    return this.engine.getPredictions(sessionId ?? this.activeSessionId ?? '');
  }

  resolvePrediction(predictionId: string, sessionId?: string): void {
    this.engine.resolvePrediction(sessionId ?? this.activeSessionId ?? '', predictionId);
  }

  // ─────────────────────────────────────────────────────────
  // CROSS-DOMAIN CORRELATION
  // ─────────────────────────────────────────────────────────

  detectCrossDomainCorrelations(sessionId?: string): CrossDomainCorrelation[] {
    return this.engine.detectCrossDomainCorrelations(sessionId ?? this.activeSessionId ?? '');
  }

  // ─────────────────────────────────────────────────────────
  // FLOW TESTS
  // ─────────────────────────────────────────────────────────

  synthesizeFlowTest(traceId: string, sessionId?: string): FlowTest | null {
    return this.engine.synthesizeFlowTest(sessionId ?? this.activeSessionId ?? '', traceId);
  }

  runFlowTests(domain?: DebugDomain, sessionId?: string) {
    return this.engine.runFlowTests(sessionId ?? this.activeSessionId ?? '', domain);
  }

  // ─────────────────────────────────────────────────────────
  // BREAKPOINTS
  // ─────────────────────────────────────────────────────────

  addBreakpoint(type: BreakpointType, condition?: string, metadata?: Record<string, unknown>, sessionId?: string): Breakpoint {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    return this.engine.addBreakpoint(id, type, condition, metadata);
  }

  removeBreakpoint(breakpointId: string, sessionId?: string): void {
    this.engine.removeBreakpoint(sessionId ?? this.activeSessionId ?? '', breakpointId);
  }

  toggleBreakpoint(breakpointId: string, sessionId?: string): void {
    this.engine.toggleBreakpoint(sessionId ?? this.activeSessionId ?? '', breakpointId);
  }

  // ─────────────────────────────────────────────────────────
  // SNAPSHOTS & REPLAY
  // ─────────────────────────────────────────────────────────

  captureSnapshot(sessionId?: string): StateSnapshot | null {
    return this.engine.captureManualSnapshot(sessionId ?? this.activeSessionId ?? '');
  }

  getSnapshots(sessionId?: string): StateSnapshot[] {
    return this.engine.getSnapshots(sessionId ?? this.activeSessionId ?? '');
  }

  replayToSnapshot(snapshotId: string, sessionId?: string): StateSnapshot | null {
    return this.engine.replayToSnapshot(sessionId ?? this.activeSessionId ?? '', snapshotId);
  }

  // ─────────────────────────────────────────────────────────
  // HIERARCHY PROPAGATION
  // ─────────────────────────────────────────────────────────

  propagateDebugEvent(event: {
    sourceAgentId: string; sourceLevel: number;
    targetAgentId: string; targetLevel: number;
    direction: 'up' | 'down' | 'lateral';
    eventType: 'error_escalation' | 'debug_request' | 'status_report' | 'intervention';
    payload: Record<string, unknown>;
    propagationPath: string[];
  }, sessionId?: string) {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    return this.engine.propagateDebugEvent(id, event);
  }

  // ─────────────────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────────────────

  generateReport(sessionId?: string): VeronicaDebugReport | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    return this.engine.generateVeronicaReport(id);
  }

  // ─────────────────────────────────────────────────────────
  // SELF-DEBUG
  // ─────────────────────────────────────────────────────────

  selfDebug() {
    return this.engine.selfDebug();
  }

  getSelfDebugLog() {
    return this.engine.getSelfDebugLog();
  }

  // ─────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────

  on(eventType: string, handler: EventHandler): () => void {
    return this.eventBus.on(eventType, handler);
  }

  onAny(handler: EventHandler): () => void {
    return this.eventBus.on('*', handler);
  }

  // ─────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────

  getConfig() {
    return this.engine.getConfig();
  }

  updateConfig(updates: Partial<CipherClawConfig>) {
    this.engine.updateConfig(updates);
  }

  // ─────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────

  getStats() {
    return this.engine.getStats();
  }

  // ─────────────────────────────────────────────────────────
  // RAW ENGINE ACCESS (for advanced use)
  // ─────────────────────────────────────────────────────────

  getEngine(): CipherClawEngine {
    return this.engine;
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

export function createCipherClaw(config?: Partial<CipherClawConfig>): CipherClawAdapter {
  return new CipherClawAdapter(config);
}
