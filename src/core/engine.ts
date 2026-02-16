/**
 * CipherClaw Engine — Thin Orchestrator
 *
 * Composes all modular components into a single, easy-to-use API.
 * Each capability lives in its own file — this class just wires them together.
 *
 * Copyright 2026 ClawLI.AI / CipherClaw
 * Licensed under Apache 2.0
 */

import type {
  DebugDomain, BreakpointType, MemoryTier,
  Span, Trace, Breakpoint, StateSnapshot,
  CausalGraph, CausalNode, CognitiveFingerprint, CognitiveMetrics,
  HierarchyDebugEvent, MemoryHealthReport,
  FailurePrediction, SoulIntegrityReport,
  CrossDomainCorrelation, Anomaly, AnomalyCascade,
  FlowTest, ClassifiedError, DebugSession,
  VeronicaDebugReport, CipherClawConfig,
} from '../types/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';
import { uid, mean, stddev, clamp, entropy } from './utils.js';
import { ERROR_PATTERNS, PREDICTION_PATTERNS } from './patterns.js';
import { createBuiltInFlowTests } from './flow-tests.js';
import { updateCausalGraph, getCausalGraph, getCausalRootCauses } from './causal-graph.js';
import { computeCognitiveFingerprint } from './cognitive-profiler.js';
import { propagateDebugEvent } from './hierarchy-propagation.js';
import { analyzeMemoryHealth } from './memory-debugger.js';
import { predictFailures, resolvePrediction, getActivePredictions, getPredictionAccuracy } from './predictive-engine.js';
import { checkSoulIntegrity } from './soul-monitor.js';
import { detectCrossDomainCorrelations, getCorrelationsForDomain } from './cross-domain.js';
import { selfDebug, logSelfDebug, getSelfDebugLog } from './self-debug.js';
import { detectAnomalies, getCascades } from './anomaly-detector.js';
import { classifyError } from './error-classifier.js';
import { addBreakpoint, removeBreakpoint, toggleBreakpoint, checkBreakpoints } from './breakpoints.js';
import { captureSnapshot, captureManualSnapshot, getSnapshots, replayToSnapshot } from './snapshots.js';
import { synthesizeFlowTest, runFlowTests } from './flow-runner.js';
import { generateVeronicaReport } from './report-generator.js';

import type { SelfDebugLogEntry, SelfDebugResult } from './self-debug.js';

// Re-export for tests that import from engine.js
export { uid, mean, stddev, clamp, entropy } from './utils.js';
export { ERROR_PATTERNS, PREDICTION_PATTERNS } from './patterns.js';
export { createBuiltInFlowTests } from './flow-tests.js';

// ─── Engine ─────────────────────────────────────────────────────────────────

export class CipherClawEngine {
  private sessions = new Map<string, DebugSession>();
  private config: CipherClawConfig;
  private predictionHistory: FailurePrediction[] = [];
  private selfDebugLog: SelfDebugLogEntry[] = [];
  private cognitiveBaselines = new Map<string, CognitiveMetrics[]>();

  constructor(config: Partial<CipherClawConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Session Management ──────────────────────────────────────────────────

  startSession(opts?: {
    domain?: DebugDomain;
    targetAgentId?: string;
    metadata?: Record<string, unknown>;
  }): DebugSession {
    const domain = opts?.domain ?? 'all';
    const agentId = opts?.targetAgentId ?? null;
    const metadata = opts?.metadata ?? {};

    const session: DebugSession = {
      id: uid('sess'),
      domain,
      targetAgentId: agentId,
      status: 'hunting',
      startedAt: Date.now(),
      endedAt: null,
      traces: [],
      errors: [],
      breakpoints: [],
      snapshots: [],
      causalGraph: { nodes: [], edges: [], rootCauses: [], impactedNodes: [], criticalPath: [] },
      cognitiveFingerprints: new Map(),
      hierarchyEvents: [],
      memoryHealth: null,
      predictions: [],
      soulIntegrity: new Map(),
      crossDomainCorrelations: [],
      anomalies: [],
      anomalyCascades: [],
      flowTests: createBuiltInFlowTests(),
      veronicaReport: null,
      metadata,
    };

    this.sessions.set(session.id, session);
    logSelfDebug(this.selfDebugLog, 'startSession', `Started ${session.id} for ${domain}`);
    return session;
  }

  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.status = 'paused';
  }

  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.status = 'hunting';
  }

  completeSession(sessionId: string): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    session.status = 'completed';
    session.endedAt = Date.now();
    session.veronicaReport = generateVeronicaReport(session, (sid) => this.runFlowTests(sid));
    logSelfDebug(this.selfDebugLog, 'completeSession', `Completed ${sessionId}`);
    return session;
  }

  // ── Configuration ──────────────────────────────────────────────────────

  getConfig(): CipherClawConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<CipherClawConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getStats(): { totalSessions: number; activeSessions: number; completedSessions: number } {
    const all = Array.from(this.sessions.values());
    return {
      totalSessions: all.length,
      activeSessions: all.filter(s => s.status !== 'completed').length,
      completedSessions: all.filter(s => s.status === 'completed').length,
    };
  }

  // ── Trace & Span Ingestion ──────────────────────────────────────────────

  ingestTrace(sessionId: string, trace: Trace): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.traces.push(trace);

    updateCausalGraph(session, trace);

    for (const span of trace.spans) {
      checkBreakpoints(session, span, (s, t, b, sp) =>
        captureSnapshot(s, t, b, sp, this.config.maxSnapshots),
      );
    }

    if (this.config.autoPredictFailures) {
      predictFailures(session, this.predictionHistory);
    }
  }

  ingestSpan(sessionId: string, span: Span): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.traces.length === 0) {
      session.traces.push({
        id: uid('trace'), sessionId, rootSpanId: span.id,
        spans: [], startTime: Date.now(), endTime: Date.now(),
        durationMs: 0, agentId: span.agentId, domain: session.domain,
        status: 'ok', totalTokens: 0, totalCost: 0,
      });
    }
    session.traces[session.traces.length - 1].spans.push(span);

    checkBreakpoints(session, span, (s, t, b, sp) =>
      captureSnapshot(s, t, b, sp, this.config.maxSnapshots),
    );
  }

  // ── Error Classification ────────────────────────────────────────────────

  classifyError(sessionId: string, message: string, span?: Partial<Span>): ClassifiedError {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return classifyError(session, message, span);
  }

  // ── Breakpoints ─────────────────────────────────────────────────────────

  addBreakpoint(sessionId: string, type: BreakpointType, condition?: string, metadata?: Record<string, unknown>): Breakpoint {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return addBreakpoint(session, type, condition, metadata);
  }

  removeBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) removeBreakpoint(session, breakpointId);
  }

  toggleBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) toggleBreakpoint(session, breakpointId);
  }

  // ── Snapshots & Replay ─────────────────────────────────────────────────

  captureManualSnapshot(sessionId: string): StateSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return captureManualSnapshot(session, this.config.maxSnapshots);
  }

  getSnapshots(sessionId: string): StateSnapshot[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getSnapshots(session);
  }

  replayToSnapshot(sessionId: string, snapshotId: string): StateSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return replayToSnapshot(session, snapshotId, this.selfDebugLog);
  }

  // ── Capability 1: Causal Debug Graph ────────────────────────────────────

  getCausalGraph(sessionId: string): CausalGraph | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return getCausalGraph(session);
  }

  getRootCauses(sessionId: string): CausalNode[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCausalRootCauses(session);
  }

  // ── Capability 2: Cognitive Fingerprinting ──────────────────────────────

  computeCognitiveFingerprint(sessionId: string, agentId: string): CognitiveFingerprint {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return computeCognitiveFingerprint(session, agentId, this.cognitiveBaselines, this.config);
  }

  getCognitiveFingerprint(sessionId: string, agentId: string): CognitiveFingerprint | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.cognitiveFingerprints.get(agentId) ?? null;
  }

  // ── Capability 3: Hierarchical Debug Propagation ────────────────────────

  propagateDebugEvent(sessionId: string, event: Parameters<typeof propagateDebugEvent>[1]): HierarchyDebugEvent {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return propagateDebugEvent(session, event);
  }

  // ── Capability 4: Multi-Tier Memory Debugging ──────────────────────────

  analyzeMemoryHealth(sessionId: string, memoryState: Parameters<typeof analyzeMemoryHealth>[1]): MemoryHealthReport {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return analyzeMemoryHealth(session, memoryState);
  }

  // ── Capability 5: Predictive Failure Engine ─────────────────────────────

  predictFailures(sessionId: string): FailurePrediction[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return predictFailures(session, this.predictionHistory);
  }

  resolvePrediction(sessionId: string, predictionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    resolvePrediction(session, predictionId, true);
  }

  getPredictions(sessionId: string): FailurePrediction[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getActivePredictions(session);
  }

  getPredictionAccuracy(): number {
    return getPredictionAccuracy(this.predictionHistory);
  }

  // ── Capability 6: Soul Integrity Monitoring ─────────────────────────────

  analyzeSoulIntegrity(
    sessionId: string,
    agentId: string,
    soulDefinition: { personality: string[]; values: string[]; style: string },
    behavior: { responses: string[]; decisions: string[]; tone: string },
  ): SoulIntegrityReport {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return checkSoulIntegrity(session, agentId, soulDefinition, behavior);
  }

  // ── Capability 7: Cross-Domain Correlation ──────────────────────────────

  detectCrossDomainCorrelations(sessionId: string): CrossDomainCorrelation[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return detectCrossDomainCorrelations(session, { correlationWindowMs: this.config.cascadeWindowMs });
  }

  getCorrelationsForDomain(sessionId: string, domain: DebugDomain): CrossDomainCorrelation[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCorrelationsForDomain(session, domain);
  }

  // ── Capability 8: Self-Debugging Agent Loop ─────────────────────────────

  selfDebug(): SelfDebugResult {
    return selfDebug(this.sessions, this.predictionHistory, this.selfDebugLog);
  }

  getSelfDebugLog(): SelfDebugLogEntry[] {
    return getSelfDebugLog(this.selfDebugLog);
  }

  // ── Capability 9: Flow Test Synthesis ───────────────────────────────────

  synthesizeFlowTest(sessionId: string, traceId: string): FlowTest | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return synthesizeFlowTest(session, traceId);
  }

  runFlowTests(sessionId: string, domain?: DebugDomain) {
    const session = this.sessions.get(sessionId);
    if (!session) return { total: 0, passed: 0, failed: 0, coverage: 0 };
    return runFlowTests(session, domain);
  }

  // ── Capability 10: Temporal Anomaly Cascade Detection ───────────────────

  detectAnomalies(sessionId: string, spans: Parameters<typeof detectAnomalies>[1]): Anomaly[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return detectAnomalies(session, spans, {
      anomalyThresholdStdDev: this.config.anomalyThresholdStdDev,
      cascadeWindowMs: this.config.cascadeWindowMs,
    });
  }

  getCascades(sessionId: string): AnomalyCascade[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCascades(session);
  }

  // ── Veronica Report ─────────────────────────────────────────────────────

  generateVeronicaReport(sessionId: string): VeronicaDebugReport | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return generateVeronicaReport(session, (sid) => this.runFlowTests(sid));
  }
}
