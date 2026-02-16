/**
 * CipherClaw — Type Definitions
 * The World's First OpenClaw Bug Hunter AI Agent
 *
 * Copyright 2026 ClawLI.AI / CipherClaw
 * Licensed under Apache 2.0
 */

// ─────────────────────────────────────────────────────────────
// Domain & Severity Enums
// ─────────────────────────────────────────────────────────────

export type DebugDomain = 'agent' | 'crm' | 'content' | 'memory' | 'tool' | 'hierarchy' | 'all';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Recoverability = 'retriable' | 'clarification' | 'fatal';

export type ErrorModule =
  | 'memory' | 'action' | 'planning' | 'crm' | 'content'
  | 'security' | 'communication' | 'reflection' | 'workflow'
  | 'tool' | 'model' | 'hierarchy' | 'system';

export type SessionStatus = 'idle' | 'hunting' | 'paused' | 'analyzing' | 'reporting' | 'completed';

export type BreakpointType =
  | 'on_error' | 'on_tool_call' | 'on_iteration' | 'on_span_category'
  | 'on_agent' | 'on_memory_op' | 'on_cost_threshold' | 'on_token_threshold'
  | 'on_latency' | 'on_pipeline_stage' | 'on_hierarchy_event'
  | 'on_soul_drift' | 'on_prediction' | 'conditional';

export type AnomalyType = 'latency_spike' | 'error_burst' | 'token_surge' | 'cost_spike'
  | 'memory_leak' | 'cascade_failure' | 'reasoning_drift' | 'soul_drift';

// ─────────────────────────────────────────────────────────────
// Trace & Span Models
// ─────────────────────────────────────────────────────────────

export interface Span {
  id: string;
  traceId: string;
  parentSpanId: string | null;
  name: string;
  category: string;
  agentId: string | null;
  domain: DebugDomain;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'ok' | 'warning' | 'error' | 'critical';
  attributes: Record<string, unknown>;
  events: SpanEvent[];
  tokenUsage?: { prompt: number; completion: number; total: number };
  cost?: number;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

export interface Trace {
  id: string;
  sessionId: string;
  rootSpanId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  durationMs: number;
  agentId: string | null;
  domain: DebugDomain;
  status: 'ok' | 'warning' | 'error' | 'critical';
  totalTokens: number;
  totalCost: number;
}

// ─────────────────────────────────────────────────────────────
// Capability 1: Causal Debug Graph (CDG)
// ─────────────────────────────────────────────────────────────

export interface CausalNode {
  id: string;
  spanId: string;
  agentId: string | null;
  operation: string;
  domain: DebugDomain;
  timestamp: number;
  durationMs: number;
  status: 'ok' | 'warning' | 'error' | 'critical';
  parents: string[];
  children: string[];
  rootCauseProbability: number;
  depth: number;
  metadata: Record<string, unknown>;
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
  rootCauses: string[];
  impactedNodes: string[];
  criticalPath: string[];
}

export interface CausalEdge {
  from: string;
  to: string;
  type: 'temporal' | 'data_dependency' | 'control_flow' | 'error_propagation' | 'hierarchy';
  weight: number;
  latencyMs: number;
}

// ─────────────────────────────────────────────────────────────
// Capability 2: Cognitive Fingerprinting
// ─────────────────────────────────────────────────────────────

export interface CognitiveMetrics {
  avgResponseLatencyMs: number;
  toolSelectionEntropy: number;
  planningDepth: number;
  reasoningTokenRatio: number;
  errorRecoveryRate: number;
  memoryUtilization: number;
  delegationFrequency: number;
  escalationRate: number;
  decisionConsistency: number;
  contextWindowUsage: number;
}

export interface CognitiveFingerprint {
  agentId: string;
  sessionId: string;
  timestamp: number;
  metrics: CognitiveMetrics;
  baseline: CognitiveMetrics | null;
  driftScore: number;
  driftDirection: 'improving' | 'degrading' | 'stable' | 'unknown';
  driftDetails: { metric: string; delta: number; severity: Severity }[];
}

// ─────────────────────────────────────────────────────────────
// Capability 3: Hierarchical Debug Propagation
// ─────────────────────────────────────────────────────────────

export interface HierarchyDebugEvent {
  id: string;
  timestamp: number;
  sourceAgentId: string;
  sourceLevel: number;
  targetAgentId: string;
  targetLevel: number;
  direction: 'up' | 'down' | 'lateral';
  eventType: 'error_escalation' | 'debug_request' | 'status_report' | 'intervention';
  payload: Record<string, unknown>;
  propagationPath: string[];
}

// ─────────────────────────────────────────────────────────────
// Capability 4: Memory Tier Debugging
// ─────────────────────────────────────────────────────────────

export type MemoryTier = 'working' | 'short_term' | 'episodic' | 'semantic' | 'archival';

export interface MemoryHealthReport {
  timestamp: number;
  tiers: Record<MemoryTier, MemoryTierHealth>;
  overallHealth: number;
  issues: MemoryIssue[];
  recommendations: string[];
}

export interface MemoryTierHealth {
  tier: MemoryTier;
  itemCount: number;
  avgDecayRate: number;
  retrievalAccuracy: number;
  promotionRate: number;
  demotionRate: number;
  staleItemCount: number;
  coherenceScore: number;
  health: number;
}

export interface MemoryIssue {
  tier: MemoryTier;
  type: 'stale_data' | 'retrieval_failure' | 'decay_anomaly' | 'coherence_break'
    | 'overflow' | 'underutilization' | 'promotion_stuck' | 'phantom_reference';
  severity: Severity;
  description: string;
  affectedItems: number;
}

// ─────────────────────────────────────────────────────────────
// Capability 5: Predictive Failure Engine
// ─────────────────────────────────────────────────────────────

export interface FailurePrediction {
  id: string;
  timestamp: number;
  predictedFailureType: string;
  confidence: number;
  timeToFailureMs: number;
  evidenceSpanIds: string[];
  suggestedAction: string;
  domain: DebugDomain;
  agentId: string | null;
  pattern: FailurePattern;
  resolved: boolean;
}

export interface FailurePattern {
  name: string;
  description: string;
  indicators: PatternIndicator[];
  historicalOccurrences: number;
  avgTimeToFailure: number;
  avgConfidence: number;
}

export interface PatternIndicator {
  metric: string;
  condition: 'increasing' | 'decreasing' | 'threshold_exceeded' | 'pattern_match';
  value: number;
  threshold: number;
  weight: number;
}

// ─────────────────────────────────────────────────────────────
// Capability 6: Soul Integrity Monitor
// ─────────────────────────────────────────────────────────────

export interface SoulIntegrityReport {
  agentId: string;
  timestamp: number;
  overallScore: number;
  dimensions: SoulDimension[];
  driftEvents: SoulDriftEvent[];
  recommendations: string[];
}

export interface SoulDimension {
  name: string;
  baselineValue: number;
  currentValue: number;
  drift: number;
  severity: Severity;
}

export interface SoulDriftEvent {
  timestamp: number;
  dimension: string;
  previousValue: number;
  newValue: number;
  trigger: string;
  spanId: string | null;
}

// ─────────────────────────────────────────────────────────────
// Capability 7: Cross-Domain Correlation
// ─────────────────────────────────────────────────────────────

export interface CrossDomainCorrelation {
  id: string;
  timestamp: number;
  domains: DebugDomain[];
  correlationType: 'causal' | 'temporal' | 'statistical';
  strength: number;
  sourceEvents: { domain: DebugDomain; spanId: string; description: string }[];
  description: string;
  suggestedAction: string;
}

// ─────────────────────────────────────────────────────────────
// Capability 9: Flow Test Synthesis
// ─────────────────────────────────────────────────────────────

export interface FlowTest {
  id: string;
  name: string;
  domain: DebugDomain;
  steps: FlowTestStep[];
  synthesizedFrom: string | null;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startedAt: number | null;
  completedAt: number | null;
  coverage: number;
}

export interface FlowTestStep {
  id: string;
  name: string;
  description: string;
  expectedOutcome: string;
  actualOutcome: string | null;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  durationMs: number | null;
  assertions: FlowAssertion[];
}

export interface FlowAssertion {
  description: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

// ─────────────────────────────────────────────────────────────
// Capability 10: Temporal Anomaly Cascade
// ─────────────────────────────────────────────────────────────

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: Severity;
  timestamp: number;
  domain: DebugDomain;
  agentId: string | null;
  spanId: string | null;
  description: string;
  value: number;
  expectedRange: { min: number; max: number };
  cascadeId: string | null;
  cascadePosition: number;
}

export interface AnomalyCascade {
  id: string;
  rootAnomalyId: string;
  anomalyIds: string[];
  startTime: number;
  endTime: number;
  affectedDomains: DebugDomain[];
  affectedAgents: string[];
  severity: Severity;
  description: string;
}

// ─────────────────────────────────────────────────────────────
// Breakpoints & Snapshots
// ─────────────────────────────────────────────────────────────

export interface Breakpoint {
  id: string;
  type: BreakpointType;
  enabled: boolean;
  condition: string | null;
  hitCount: number;
  maxHits: number | null;
  createdAt: number;
  lastHitAt: number | null;
  metadata: Record<string, unknown>;
}

export interface StateSnapshot {
  id: string;
  sessionId: string;
  timestamp: number;
  triggeredBy: string;
  agentStates: Record<string, unknown>;
  memoryState: Record<string, unknown>;
  contextWindow: unknown[];
  breakpointId: string | null;
  spanId: string | null;
}

// ─────────────────────────────────────────────────────────────
// Error Classification
// ─────────────────────────────────────────────────────────────

export interface ClassifiedError {
  id: string;
  timestamp: number;
  message: string;
  stack: string | null;
  module: ErrorModule;
  severity: Severity;
  recoverability: Recoverability;
  domain: DebugDomain;
  agentId: string | null;
  spanId: string | null;
  rootCauseNodeId: string | null;
  suggestedFix: string;
  retryCount: number;
  resolved: boolean;
}

// ─────────────────────────────────────────────────────────────
// Debug Session
// ─────────────────────────────────────────────────────────────

export interface DebugSession {
  id: string;
  status: SessionStatus;
  domain: DebugDomain;
  targetAgentId: string | null;
  startedAt: number;
  endedAt: number | null;
  traces: Trace[];
  causalGraph: CausalGraph;
  cognitiveFingerprints: Map<string, CognitiveFingerprint>;
  errors: ClassifiedError[];
  breakpoints: Breakpoint[];
  snapshots: StateSnapshot[];
  flowTests: FlowTest[];
  anomalies: Anomaly[];
  anomalyCascades: AnomalyCascade[];
  predictions: FailurePrediction[];
  soulIntegrity: Map<string, SoulIntegrityReport>;
  memoryHealth: MemoryHealthReport | null;
  crossDomainCorrelations: CrossDomainCorrelation[];
  hierarchyEvents: HierarchyDebugEvent[];
  veronicaReport: VeronicaDebugReport | null;
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Veronica Report
// ─────────────────────────────────────────────────────────────

export interface VeronicaDebugReport {
  sessionId: string;
  generatedAt: number;
  healthScore: number;
  summary: string;
  severityBreakdown: Record<Severity, number>;
  domainBreakdown: Record<string, { errors: number; anomalies: number; health: number }>;
  topIssues: { description: string; severity: Severity; domain: DebugDomain; count: number }[];
  causalRootCauses: { nodeId: string; description: string; probability: number }[];
  predictions: FailurePrediction[];
  cognitiveAlerts: { agentId: string; driftScore: number; direction: string }[];
  soulAlerts: { agentId: string; integrityScore: number; driftDimensions: string[] }[];
  memoryAlerts: MemoryIssue[];
  flowTestResults: { total: number; passed: number; failed: number; coverage: number };
  recommendations: string[];
  actionItems: { priority: Severity; action: string; domain: DebugDomain }[];
}

// ─────────────────────────────────────────────────────────────
// OpenClaw Integration Types
// ─────────────────────────────────────────────────────────────

export interface OpenClawAgentDef {
  id: string;
  name: string;
  tier: 'sovereign' | 'orchestrator' | 'specialist' | 'worker';
  team: string;
  parentId: string | null;
  skills: string[];
  tools: string[];
  model: { provider: string; model: string };
  soul: { personality: string[]; values: string[]; style: string };
}

export interface OpenClawEvent {
  id: string;
  type: string;
  source: string;
  target: string | null;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Engine Configuration
// ─────────────────────────────────────────────────────────────

export interface CipherClawConfig {
  maxTraces: number;
  maxSpansPerTrace: number;
  maxSnapshots: number;
  anomalyThresholdStdDev: number;
  cascadeWindowMs: number;
  predictionLookbackMs: number;
  cognitiveBaselineSessions: number;
  soulDriftThreshold: number;
  memoryHealthCheckIntervalMs: number;
  autoClassifyErrors: boolean;
  autoBuildCausalGraph: boolean;
  autoDetectAnomalies: boolean;
  autoPredictFailures: boolean;
  enableSelfDebug: boolean;
  enableHierarchyPropagation: boolean;
  persistToSupabase: boolean;
}

export const DEFAULT_CONFIG: CipherClawConfig = {
  maxTraces: 10000,
  maxSpansPerTrace: 500,
  maxSnapshots: 200,
  anomalyThresholdStdDev: 2.5,
  cascadeWindowMs: 30000,
  predictionLookbackMs: 300000,
  cognitiveBaselineSessions: 10,
  soulDriftThreshold: 15,
  memoryHealthCheckIntervalMs: 60000,
  autoClassifyErrors: true,
  autoBuildCausalGraph: true,
  autoDetectAnomalies: true,
  autoPredictFailures: true,
  enableSelfDebug: true,
  enableHierarchyPropagation: true,
  persistToSupabase: true,
};
