// CipherClaw — OpenClaw adapter. Wraps the engine with an event bus for
// integration into any OpenClaw-compatible agent orchestration system.

import { CipherClawEngine } from '../core/engine.js';
import type {
  DebugDomain, Span, Trace, DebugSession, VeronicaDebugReport,
  CausalGraph, CognitiveFingerprint, MemoryHealthReport,
  SoulIntegrityReport, FailurePrediction, CrossDomainCorrelation,
  Anomaly, FlowTest, ClassifiedError,
  Breakpoint, BreakpointType, StateSnapshot,
  CipherClawConfig, OpenClawEvent, MemoryTier,
  HierarchyDebugEvent,
} from '../types/index.js';
import { CIPHERCLAW_MANIFEST } from './manifest.js';

// ── Event Bus ────────────────────────────────────────────────────────────────

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
    for (const key of [event.type, '*']) {
      const set = this.handlers.get(key);
      if (set) {
        for (const h of set) {
          try { h(event); } catch (e) { console.error('[CipherClaw] Event handler error:', e); }
        }
      }
    }
  }
}

function evt(type: string, source: string, target: string | null, payload: Record<string, unknown>): OpenClawEvent {
  return { id: `evt_${Date.now()}`, type, source, target, timestamp: Date.now(), payload };
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export class CipherClawAdapter {
  private engine: CipherClawEngine;
  private eventBus: EventBus;
  private activeSessionId: string | null = null;

  constructor(config?: Partial<CipherClawConfig>) {
    this.engine = new CipherClawEngine(config);
    this.eventBus = new EventBus();
  }

  getManifest() { return CIPHERCLAW_MANIFEST; }

  // ── Sessions ─────────────────────────────────────────────────────────────

  startSession(opts?: { domain?: DebugDomain; targetAgentId?: string }): DebugSession {
    const session = this.engine.startSession(opts);
    this.activeSessionId = session.id;
    this.eventBus.emit(evt('session-started', 'cipherclaw-phantom', null, { sessionId: session.id, domain: session.domain }));
    return session;
  }

  completeSession(sessionId?: string): DebugSession | undefined {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return undefined;
    const session = this.engine.completeSession(id);
    if (session) {
      this.eventBus.emit(evt('session-completed', 'cipherclaw-phantom', null, { sessionId: session.id, healthScore: session.veronicaReport?.healthScore ?? 0 }));
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

  // ── Ingestion ────────────────────────────────────────────────────────────

  ingestTrace(trace: Trace, sessionId?: string): void {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return;
    this.engine.ingestTrace(id, trace);
    this.eventBus.emit(evt('trace-ingested', 'cipherclaw-trace-analyst', null, { traceId: trace.id, spans: trace.spans.length }));
  }

  ingestSpan(span: Span, sessionId?: string): void {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return;
    this.engine.ingestSpan(id, span);
  }

  // ── Error Classification ─────────────────────────────────────────────────

  classifyError(message: string, span?: Partial<Span>, sessionId?: string): ClassifiedError {
    const id = sessionId ?? this.activeSessionId;
    if (!id) throw new Error('No active session');
    const error = this.engine.classifyError(id, message, span);
    this.eventBus.emit(evt('error-classified', 'cipherclaw-error-classifier', null, { errorId: error.id, module: error.module, severity: error.severity }));
    return error;
  }

  // ── Causal Analysis ──────────────────────────────────────────────────────

  getCausalGraph(sessionId?: string): CausalGraph | null {
    return this.engine.getCausalGraph(sessionId ?? this.activeSessionId ?? '');
  }

  getRootCauses(sessionId?: string) {
    return this.engine.getRootCauses(sessionId ?? this.activeSessionId ?? '');
  }

  // ── Cognitive Fingerprinting ─────────────────────────────────────────────

  computeCognitiveFingerprint(agentId: string, sessionId?: string): CognitiveFingerprint | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return null;
    const fp = this.engine.computeCognitiveFingerprint(id, agentId);
    if (fp && fp.driftScore > 15) {
      this.eventBus.emit(evt('cognitive-drift-detected', 'cipherclaw-cognitive-profiler', agentId, { agentId, driftScore: fp.driftScore }));
    }
    return fp;
  }

  // ── Soul Integrity ───────────────────────────────────────────────────────
  // Engine signature: analyzeSoulIntegrity(sessionId, soulDef, behavior)
  // where soulDef = { personality: string[], values: string[], style: string[] }
  // and behavior = { responses: string[], decisions: string[], tone: string[] }

  analyzeSoulIntegrity(
    agentId: string,
    soulDefinition: { personality: string[]; values: string[]; style: string },
    behavior: { responses: string[]; decisions: string[]; tone: string },
    sessionId?: string,
  ): SoulIntegrityReport | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return null;
    const report = this.engine.analyzeSoulIntegrity(id, agentId, soulDefinition, behavior);
    if (report && report.overallScore < 80) {
      this.eventBus.emit(evt('soul-drift-detected', 'cipherclaw-cognitive-profiler', report.agentId, { agentId: report.agentId, driftScore: 100 - report.overallScore }));
    }
    return report;
  }

  // ── Memory Health ────────────────────────────────────────────────────────

  analyzeMemoryHealth(
    memoryState: Record<MemoryTier, { items: unknown[]; decayRates: number[]; retrievalHits: number; retrievalMisses: number }>,
    sessionId?: string,
  ): MemoryHealthReport | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return null;
    return this.engine.analyzeMemoryHealth(id, memoryState);
  }

  // ── Anomaly Detection ────────────────────────────────────────────────────

  detectAnomalies(spans: { id: string; name: string; durationMs: number }[], sessionId?: string): Anomaly[] {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return [];
    const anomalies = this.engine.detectAnomalies(id, spans);
    for (const a of anomalies) {
      this.eventBus.emit(evt('anomaly-detected', 'cipherclaw-trace-analyst', null, { anomalyId: a.id, type: a.type, severity: a.severity }));
    }
    return anomalies;
  }

  // ── Predictions ──────────────────────────────────────────────────────────

  getPredictions(sessionId?: string): FailurePrediction[] {
    return this.engine.getPredictions(sessionId ?? this.activeSessionId ?? '');
  }

  resolvePrediction(predictionId: string, wasAccurate: boolean, sessionId?: string): void {
    this.engine.resolvePrediction(sessionId ?? this.activeSessionId ?? '', predictionId, wasAccurate);
  }

  // ── Cross-Domain Correlation ─────────────────────────────────────────────

  detectCrossDomainCorrelations(sessionId?: string): CrossDomainCorrelation[] {
    return this.engine.detectCrossDomainCorrelations(sessionId ?? this.activeSessionId ?? '');
  }

  // ── Flow Tests ───────────────────────────────────────────────────────────

  synthesizeFlowTest(traceId: string, sessionId?: string): FlowTest | null {
    return this.engine.synthesizeFlowTest(sessionId ?? this.activeSessionId ?? '', traceId);
  }

  runFlowTests(domain?: DebugDomain, sessionId?: string) {
    return this.engine.runFlowTests(sessionId ?? this.activeSessionId ?? '', domain);
  }

  // ── Breakpoints ──────────────────────────────────────────────────────────

  addBreakpoint(type: BreakpointType, condition?: string, metadata?: Record<string, unknown>, sessionId?: string): Breakpoint | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return null;
    return this.engine.addBreakpoint(id, type, condition ?? '', metadata);
  }

  removeBreakpoint(breakpointId: string, sessionId?: string): void {
    this.engine.removeBreakpoint(sessionId ?? this.activeSessionId ?? '', breakpointId);
  }

  toggleBreakpoint(breakpointId: string, sessionId?: string): void {
    this.engine.toggleBreakpoint(sessionId ?? this.activeSessionId ?? '', breakpointId);
  }

  // ── Snapshots & Replay ───────────────────────────────────────────────────

  captureSnapshot(sessionId?: string): StateSnapshot | null {
    return this.engine.captureManualSnapshot(sessionId ?? this.activeSessionId ?? '');
  }

  getSnapshots(sessionId?: string): StateSnapshot[] {
    return this.engine.getSnapshots(sessionId ?? this.activeSessionId ?? '');
  }

  replayToSnapshot(snapshotId: string, sessionId?: string): StateSnapshot | null {
    return this.engine.replayToSnapshot(sessionId ?? this.activeSessionId ?? '', snapshotId);
  }

  // ── Hierarchy Propagation ────────────────────────────────────────────────

  propagateDebugEvent(event: HierarchyDebugEvent, sessionId?: string): HierarchyDebugEvent {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return event;
    return this.engine.propagateDebugEvent(id, event);
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  generateReport(sessionId?: string): VeronicaDebugReport | null {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return null;
    return this.engine.generateVeronicaReport(id);
  }

  // ── Self-Debug ───────────────────────────────────────────────────────────

  selfDebug() { return this.engine.selfDebug(); }
  getSelfDebugLog() { return this.engine.getSelfDebugLog(); }

  // ── Events ───────────────────────────────────────────────────────────────

  on(eventType: string, handler: EventHandler): () => void {
    return this.eventBus.on(eventType, handler);
  }

  onAny(handler: EventHandler): () => void {
    return this.eventBus.on('*', handler);
  }

  // ── Configuration ────────────────────────────────────────────────────────

  getConfig() { return this.engine.getConfig(); }
  updateConfig(updates: Partial<CipherClawConfig>) { this.engine.updateConfig(updates); }
  getStats() { return this.engine.getStats(); }

  // ── Raw Engine Access ────────────────────────────────────────────────────

  getEngine(): CipherClawEngine { return this.engine; }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createCipherClaw(config?: Partial<CipherClawConfig>): CipherClawAdapter {
  return new CipherClawAdapter(config);
}
