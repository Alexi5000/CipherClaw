/**
 * CipherClaw — The World's First OpenClaw Bug Hunter AI Agent
 *
 * Patent-pending debug platform with:
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

// Core Engine
export { CipherClawEngine, ERROR_PATTERNS, PREDICTION_PATTERNS, createBuiltInFlowTests } from './core/engine.js';
export { uid, mean, stddev, clamp, entropy } from './core/engine.js';

// OpenClaw Adapter
export { CipherClawAdapter, createCipherClaw } from './openclaw/adapter.js';
export type { EventHandler } from './openclaw/adapter.js';

// OpenClaw Manifest
export {
  CIPHERCLAW_MANIFEST,
  CIPHERCLAW_AGENTS,
  CIPHERCLAW_SKILLS,
  CIPHERCLAW_TOOLS,
  CIPHERCLAW_EVENTS,
} from './openclaw/manifest.js';

// Types
export type {
  // Enums & Primitives
  DebugDomain, Severity, Recoverability, ErrorModule, SessionStatus,
  BreakpointType, AnomalyType, MemoryTier,
  // Trace & Span
  Span, SpanEvent, Trace,
  // Causal Debug Graph
  CausalNode, CausalGraph, CausalEdge,
  // Cognitive Fingerprinting
  CognitiveMetrics, CognitiveFingerprint,
  // Hierarchy
  HierarchyDebugEvent,
  // Memory
  MemoryHealthReport, MemoryTierHealth, MemoryIssue,
  // Predictions
  FailurePrediction, FailurePattern, PatternIndicator,
  // Soul Integrity
  SoulIntegrityReport, SoulDimension, SoulDriftEvent,
  // Cross-Domain
  CrossDomainCorrelation,
  // Flow Tests
  FlowTest, FlowTestStep, FlowAssertion,
  // Anomalies
  Anomaly, AnomalyCascade,
  // Breakpoints & Snapshots
  Breakpoint, StateSnapshot,
  // Errors
  ClassifiedError,
  // Session & Report
  DebugSession, VeronicaDebugReport,
  // OpenClaw
  OpenClawAgentDef, OpenClawEvent,
  // Config
  CipherClawConfig,
} from './types/index.js';

export { DEFAULT_CONFIG } from './types/index.js';
