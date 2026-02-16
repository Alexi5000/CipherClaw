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

/**
 * CipherClawEngine is the primary orchestrator for all debug capabilities.
 *
 * It manages debug sessions, coordinates trace ingestion, and delegates
 * analysis to specialized modules (causal graph, cognitive profiler,
 * anomaly detector, predictive engine, etc.). All state is session-scoped.
 *
 * @example
 * ```ts
 * import { CipherClawEngine } from 'cipherclaw';
 *
 * const engine = new CipherClawEngine();
 * const session = engine.startSession({ domain: 'agent' });
 * engine.ingestTrace(session.id, trace);
 * const graph = engine.getCausalGraph(session.id);
 * engine.completeSession(session.id);
 * ```
 */
export class CipherClawEngine {
  private sessions = new Map<string, DebugSession>();
  private config: CipherClawConfig;
  private predictionHistory: FailurePrediction[] = [];
  private selfDebugLog: SelfDebugLogEntry[] = [];
  private cognitiveBaselines = new Map<string, CognitiveMetrics[]>();

  /**
   * Create a new CipherClaw engine instance.
   * @param config - Partial configuration to override defaults.
   */
  constructor(config: Partial<CipherClawConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Session Management ──────────────────────────────────────────────────

  /**
   * Start a new debug session.
   * @param opts - Optional session parameters: domain, targetAgentId, metadata.
   * @returns The newly created DebugSession.
   */
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

  /**
   * Retrieve a session by ID.
   * @param sessionId - The session identifier.
   * @returns The session, or undefined if not found.
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions managed by this engine instance.
   * @returns Array of all DebugSession objects.
   */
  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Pause an active session. Sets status to 'paused'.
   * @param sessionId - The session to pause.
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.status = 'paused';
  }

  /**
   * Resume a paused session. Sets status back to 'hunting'.
   * @param sessionId - The session to resume.
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.status = 'hunting';
  }

  /**
   * Complete a session, generating the Veronica report automatically.
   * @param sessionId - The session to complete.
   * @returns The completed session with report, or undefined if not found.
   */
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

  /**
   * Get the current engine configuration (defensive copy).
   * @returns A copy of the current CipherClawConfig.
   */
  getConfig(): CipherClawConfig {
    return { ...this.config };
  }

  /**
   * Update engine configuration with partial overrides.
   * @param partial - Fields to merge into the current config.
   */
  updateConfig(partial: Partial<CipherClawConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  /**
   * Get aggregate session statistics.
   * @returns Object with totalSessions, activeSessions, and completedSessions counts.
   */
  getStats(): { totalSessions: number; activeSessions: number; completedSessions: number } {
    const all = Array.from(this.sessions.values());
    return {
      totalSessions: all.length,
      activeSessions: all.filter(s => s.status !== 'completed').length,
      completedSessions: all.filter(s => s.status === 'completed').length,
    };
  }

  // ── Trace & Span Ingestion ──────────────────────────────────────────────

  /**
   * Ingest a complete trace into a session. Updates the causal graph,
   * checks breakpoints, and optionally runs failure prediction.
   * @param sessionId - Target session.
   * @param trace - The trace to ingest (must include spans).
   */
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

  /**
   * Ingest a single span into the most recent trace of a session.
   * Creates a synthetic trace if none exists.
   * @param sessionId - Target session.
   * @param span - The span to ingest.
   */
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

  /**
   * Classify an error message using the built-in error pattern matrix.
   * @param sessionId - Target session.
   * @param message - The error message to classify.
   * @param span - Optional partial span for context.
   * @returns The classified error with module, severity, and suggested fix.
   * @throws If the session is not found.
   */
  classifyError(sessionId: string, message: string, span?: Partial<Span>): ClassifiedError {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return classifyError(session, message, span);
  }

  // ── Breakpoints ─────────────────────────────────────────────────────────

  /**
   * Add a breakpoint to a session. When a matching span is ingested,
   * a state snapshot is captured automatically.
   * @param sessionId - Target session.
   * @param type - The breakpoint type (e.g., 'error', 'latency', 'token-budget').
   * @param condition - Optional condition string for conditional breakpoints.
   * @param metadata - Optional metadata to attach to the breakpoint.
   * @returns The created Breakpoint.
   * @throws If the session is not found.
   */
  addBreakpoint(sessionId: string, type: BreakpointType, condition?: string, metadata?: Record<string, unknown>): Breakpoint {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return addBreakpoint(session, type, condition, metadata);
  }

  /**
   * Remove a breakpoint from a session.
   * @param sessionId - Target session.
   * @param breakpointId - The breakpoint to remove.
   */
  removeBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) removeBreakpoint(session, breakpointId);
  }

  /**
   * Toggle a breakpoint's enabled state.
   * @param sessionId - Target session.
   * @param breakpointId - The breakpoint to toggle.
   */
  toggleBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) toggleBreakpoint(session, breakpointId);
  }

  // ── Snapshots & Replay ─────────────────────────────────────────────────

  /**
   * Capture a manual state snapshot of the current session state.
   * @param sessionId - Target session.
   * @returns The captured snapshot, or null if session not found or limit reached.
   */
  captureManualSnapshot(sessionId: string): StateSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return captureManualSnapshot(session, this.config.maxSnapshots);
  }

  /**
   * Get all snapshots for a session.
   * @param sessionId - Target session.
   * @returns Array of StateSnapshot objects.
   */
  getSnapshots(sessionId: string): StateSnapshot[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getSnapshots(session);
  }

  /**
   * Replay session state to a specific snapshot (time-travel debugging).
   * @param sessionId - Target session.
   * @param snapshotId - The snapshot to replay to.
   * @returns The target snapshot, or null if not found.
   */
  replayToSnapshot(sessionId: string, snapshotId: string): StateSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return replayToSnapshot(session, snapshotId, this.selfDebugLog);
  }

  // ── Capability 1: Causal Debug Graph ────────────────────────────────────

  /**
   * Get the causal debug graph for a session. The graph is built
   * incrementally as traces are ingested.
   * @param sessionId - Target session.
   * @returns The CausalGraph, or null if session not found.
   */
  getCausalGraph(sessionId: string): CausalGraph | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return getCausalGraph(session);
  }

  /**
   * Get root cause nodes from the causal graph, sorted by probability.
   * @param sessionId - Target session.
   * @returns Array of CausalNode objects identified as root causes.
   */
  getRootCauses(sessionId: string): CausalNode[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCausalRootCauses(session);
  }

  // ── Capability 2: Cognitive Fingerprinting ──────────────────────────────

  /**
   * Compute a cognitive fingerprint for an agent based on its trace data.
   * Measures 8 behavioral dimensions and detects drift from baseline.
   * @param sessionId - Target session.
   * @param agentId - The agent to fingerprint.
   * @returns The computed CognitiveFingerprint with drift analysis.
   * @throws If the session is not found.
   */
  computeCognitiveFingerprint(sessionId: string, agentId: string): CognitiveFingerprint {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return computeCognitiveFingerprint(session, agentId, this.cognitiveBaselines, this.config);
  }

  /**
   * Retrieve a previously computed cognitive fingerprint for an agent.
   * @param sessionId - Target session.
   * @param agentId - The agent whose fingerprint to retrieve.
   * @returns The fingerprint, or null if not yet computed.
   */
  getCognitiveFingerprint(sessionId: string, agentId: string): CognitiveFingerprint | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.cognitiveFingerprints.get(agentId) ?? null;
  }

  // ── Capability 3: Hierarchical Debug Propagation ────────────────────────

  /**
   * Propagate a debug event through the agent hierarchy.
   * Events flow up (to parent), down (to children), or laterally (to siblings).
   * @param sessionId - Target session.
   * @param event - The event to propagate (sourceAgentId, targetAgentId, direction, severity, message).
   * @returns The recorded HierarchyDebugEvent with propagation metadata.
   * @throws If the session is not found.
   */
  propagateDebugEvent(sessionId: string, event: Parameters<typeof propagateDebugEvent>[1]): HierarchyDebugEvent {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return propagateDebugEvent(session, event);
  }

  // ── Capability 4: Multi-Tier Memory Debugging ──────────────────────────

  /**
   * Analyze memory health across all 5 tiers: working, short-term,
   * episodic, semantic, and archival. Detects stale data, retrieval
   * failures, and tier imbalances.
   * @param sessionId - Target session.
   * @param memoryState - Current memory state per tier (entries, staleness, retrievalLatencyMs).
   * @returns A MemoryHealthReport with per-tier health and detected issues.
   * @throws If the session is not found.
   */
  analyzeMemoryHealth(sessionId: string, memoryState: Parameters<typeof analyzeMemoryHealth>[1]): MemoryHealthReport {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return analyzeMemoryHealth(session, memoryState);
  }

  // ── Capability 5: Predictive Failure Engine ─────────────────────────────

  /**
   * Run all 6 failure prediction patterns against the current session state.
   * @param sessionId - Target session.
   * @returns Array of FailurePrediction objects with confidence and suggested actions.
   */
  predictFailures(sessionId: string): FailurePrediction[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return predictFailures(session, this.predictionHistory);
  }

  /**
   * Mark a prediction as resolved (correct).
   * @param sessionId - Target session.
   * @param predictionId - The prediction to resolve.
   */
  resolvePrediction(sessionId: string, predictionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    resolvePrediction(session, predictionId, true);
  }

  /**
   * Get all active (unresolved) predictions for a session.
   * @param sessionId - Target session.
   * @returns Array of active FailurePrediction objects.
   */
  getPredictions(sessionId: string): FailurePrediction[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getActivePredictions(session);
  }

  /**
   * Get the overall prediction accuracy across all sessions.
   * @returns Accuracy as a number between 0 and 1.
   */
  getPredictionAccuracy(): number {
    return getPredictionAccuracy(this.predictionHistory);
  }

  // ── Capability 6: Soul Integrity Monitoring ─────────────────────────────

  /**
   * Analyze how well an agent's observed behavior aligns with its
   * defined soul (personality, values, style).
   * @param sessionId - Target session.
   * @param agentId - The agent to analyze.
   * @param soulDefinition - The agent's defined personality, values, and style.
   * @param behavior - The agent's observed responses, decisions, and tone.
   * @returns A SoulIntegrityReport with adherence scores and drift detection.
   * @throws If the session is not found.
   */
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

  /**
   * Detect correlations across debug domains (agent, CRM, content, infrastructure).
   * Finds shared failure patterns and temporal co-occurrences.
   * @param sessionId - Target session.
   * @returns Array of CrossDomainCorrelation objects.
   */
  detectCrossDomainCorrelations(sessionId: string): CrossDomainCorrelation[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return detectCrossDomainCorrelations(session, { correlationWindowMs: this.config.cascadeWindowMs });
  }

  /**
   * Get correlations filtered to a specific domain.
   * @param sessionId - Target session.
   * @param domain - The domain to filter by.
   * @returns Array of CrossDomainCorrelation objects involving the specified domain.
   */
  getCorrelationsForDomain(sessionId: string, domain: DebugDomain): CrossDomainCorrelation[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCorrelationsForDomain(session, domain);
  }

  // ── Capability 8: Self-Debugging Agent Loop ─────────────────────────────

  /**
   * Run self-diagnostics on the CipherClaw engine itself.
   * Checks session health, prediction accuracy, and internal consistency.
   * @returns A SelfDebugResult with health status and any detected issues.
   */
  selfDebug(): SelfDebugResult {
    return selfDebug(this.sessions, this.predictionHistory, this.selfDebugLog);
  }

  /**
   * Get the internal self-debug log.
   * @returns Array of SelfDebugLogEntry objects.
   */
  getSelfDebugLog(): SelfDebugLogEntry[] {
    return getSelfDebugLog(this.selfDebugLog);
  }

  // ── Capability 9: Flow Test Synthesis ───────────────────────────────────

  /**
   * Synthesize an integration test from an observed trace.
   * The generated test can be replayed to verify behavior.
   * @param sessionId - Target session.
   * @param traceId - The trace to synthesize a test from.
   * @returns The synthesized FlowTest, or null if trace not found.
   */
  synthesizeFlowTest(sessionId: string, traceId: string): FlowTest | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return synthesizeFlowTest(session, traceId);
  }

  /**
   * Run all flow tests for a session, optionally filtered by domain.
   * @param sessionId - Target session.
   * @param domain - Optional domain filter.
   * @returns Test results with total, passed, failed, and coverage counts.
   */
  runFlowTests(sessionId: string, domain?: DebugDomain) {
    const session = this.sessions.get(sessionId);
    if (!session) return { total: 0, passed: 0, failed: 0, coverage: 0 };
    return runFlowTests(session, domain);
  }

  // ── Capability 10: Temporal Anomaly Cascade Detection ───────────────────

  /**
   * Detect anomalies in a set of spans using statistical analysis.
   * Anomalies exceeding the configured threshold trigger cascade detection.
   * @param sessionId - Target session.
   * @param spans - The spans to analyze for anomalies.
   * @returns Array of detected Anomaly objects.
   */
  detectAnomalies(sessionId: string, spans: Parameters<typeof detectAnomalies>[1]): Anomaly[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return detectAnomalies(session, spans, {
      anomalyThresholdStdDev: this.config.anomalyThresholdStdDev,
      cascadeWindowMs: this.config.cascadeWindowMs,
    });
  }

  /**
   * Get all detected anomaly cascades for a session.
   * A cascade is a sequence of anomalies occurring within the configured time window.
   * @param sessionId - Target session.
   * @returns Array of AnomalyCascade objects.
   */
  getCascades(sessionId: string): AnomalyCascade[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return getCascades(session);
  }

  // ── Veronica Report ─────────────────────────────────────────────────────

  /**
   * Generate a comprehensive Veronica debug report for a session.
   * Includes health score, summary, all findings, and flow test results.
   * @param sessionId - Target session.
   * @returns The VeronicaDebugReport, or null if session not found.
   */
  generateVeronicaReport(sessionId: string): VeronicaDebugReport | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return generateVeronicaReport(session, (sid) => this.runFlowTests(sid));
  }
}
