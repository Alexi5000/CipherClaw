/**
 * CipherClaw — OpenClaw Bug Hunter AI Agent
 *
 * A modular debug toolkit for multi-agent systems.
 * Each capability lives in its own file — import only what you need.
 *
 *  1. Causal Debug Graph (CDG)
 *  2. Cognitive Fingerprinting
 *  3. Hierarchical Debug Propagation
 *  4. Memory Tier Debugging
 *  5. Predictive Failure Engine
 *  6. Soul Integrity Monitor
 *  7. Cross-Domain Correlation
 *  8. Self-Debugging Agent Loop
 *  9. Flow Test Synthesis
 * 10. Temporal Anomaly Cascade Detection
 *
 * @packageDocumentation
 * @module cipherclaw
 * @license Apache-2.0
 * @author ClawLI.AI
 * @see https://cipherclaw.com
 * @see https://github.com/Alexi5000/CipherClaw
 */

// ── Core Engine (thin orchestrator) ─────────────────────────────────────────
export { CipherClawEngine } from './core/engine.js';

// ── Individual Modules (for tree-shaking / selective import) ────────────────
export { uid, mean, stddev, clamp, entropy } from './core/utils.js';
export { ERROR_PATTERNS, PREDICTION_PATTERNS } from './core/patterns.js';
export { createBuiltInFlowTests } from './core/flow-tests.js';
export { updateCausalGraph, getCausalGraph, getCausalRootCauses } from './core/causal-graph.js';
export { updateCognitiveFingerprint, getCognitiveFingerprint, detectCognitiveDrift } from './core/cognitive-profiler.js';
export { propagateDebugEvent, getUnacknowledgedEvents, acknowledgeEvent } from './core/hierarchy-propagation.js';
export { analyzeMemoryHealth } from './core/memory-debugger.js';
export { predictFailures, resolvePrediction, getActivePredictions, getPredictionAccuracy } from './core/predictive-engine.js';
export { checkSoulIntegrity } from './core/soul-monitor.js';
export { detectCrossDomainCorrelations, getCorrelationsForDomain } from './core/cross-domain.js';
export { selfDebug, logSelfDebug, getSelfDebugLog } from './core/self-debug.js';
export { detectAnomalies, getCascades } from './core/anomaly-detector.js';
export { classifyError } from './core/error-classifier.js';
export { addBreakpoint, removeBreakpoint, toggleBreakpoint, checkBreakpoints } from './core/breakpoints.js';
export { captureSnapshot, captureManualSnapshot, getSnapshots, replayToSnapshot } from './core/snapshots.js';
export { synthesizeFlowTest, runFlowTests } from './core/flow-runner.js';
export { generateVeronicaReport } from './core/report-generator.js';

// ── OpenClaw Adapter ────────────────────────────────────────────────────────
export { CipherClawAdapter, createCipherClaw } from './openclaw/adapter.js';
export type { EventHandler } from './openclaw/adapter.js';

// ── OpenClaw Manifest ───────────────────────────────────────────────────────
export {
  CIPHERCLAW_MANIFEST,
  CIPHERCLAW_AGENTS,
  CIPHERCLAW_SKILLS,
  CIPHERCLAW_TOOLS,
  CIPHERCLAW_EVENTS,
} from './openclaw/manifest.js';

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  DebugDomain, Severity, Recoverability, ErrorModule, SessionStatus,
  BreakpointType, AnomalyType, MemoryTier,
  Span, SpanEvent, Trace,
  CausalNode, CausalGraph, CausalEdge,
  CognitiveMetrics, CognitiveFingerprint,
  HierarchyDebugEvent,
  MemoryHealthReport, MemoryTierHealth, MemoryIssue,
  FailurePrediction, FailurePattern, PatternIndicator,
  SoulIntegrityReport, SoulDimension, SoulDriftEvent,
  CrossDomainCorrelation,
  FlowTest, FlowTestStep, FlowAssertion,
  Anomaly, AnomalyCascade,
  Breakpoint, StateSnapshot,
  ClassifiedError,
  DebugSession, VeronicaDebugReport,
  OpenClawAgentDef, OpenClawEvent,
  CipherClawConfig,
} from './types/index.js';

export { DEFAULT_CONFIG } from './types/index.js';
