/**
 * CipherClaw Core Engine
 * The World's First OpenClaw Bug Hunter AI Agent
 *
 * This engine implements 10 core capabilities:
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
 * Copyright 2026 ClawLI.AI / CipherClaw
 * Licensed under Apache 2.0
 */

import type {
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
  CipherClawConfig,
} from '../types/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

let _idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function entropy(frequencies: number[]): number {
  const total = frequencies.reduce((s, f) => s + f, 0);
  if (total === 0) return 0;
  return -frequencies
    .filter(f => f > 0)
    .map(f => f / total)
    .reduce((s, p) => s + p * Math.log2(p), 0);
}

// ═══════════════════════════════════════════════════════════════
// ERROR PATTERN DATABASE
// ═══════════════════════════════════════════════════════════════

interface ErrorPattern {
  pattern: RegExp;
  module: ErrorModule;
  severity: Severity;
  recoverability: Recoverability;
  suggestedFix: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Memory errors
  { pattern: /memory.*overflow|out of memory/i, module: 'memory', severity: 'critical', recoverability: 'retriable', suggestedFix: 'Increase memory limits or implement memory pruning strategy' },
  { pattern: /memory.*retriev|recall.*fail/i, module: 'memory', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check memory tier health and retrieval indices' },
  { pattern: /memory.*decay|stale.*memory/i, module: 'memory', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Adjust decay rates or promote critical memories' },
  { pattern: /memory.*coherence|inconsistent.*memory/i, module: 'memory', severity: 'high', recoverability: 'clarification', suggestedFix: 'Run memory coherence check and reconcile tiers' },
  // Model/LLM errors
  { pattern: /rate.*limit|429|too many requests/i, module: 'model', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Implement exponential backoff or switch to fallback model' },
  { pattern: /context.*window|token.*limit|max.*tokens/i, module: 'model', severity: 'high', recoverability: 'retriable', suggestedFix: 'Reduce context size or implement sliding window' },
  { pattern: /model.*unavailable|503|service.*unavailable/i, module: 'model', severity: 'high', recoverability: 'retriable', suggestedFix: 'Switch to fallback model provider' },
  { pattern: /invalid.*response|malformed.*json|parse.*error/i, module: 'model', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Add response validation and retry with stricter prompt' },
  { pattern: /hallucination|confabulation|fabricat/i, module: 'model', severity: 'high', recoverability: 'clarification', suggestedFix: 'Add grounding checks and fact verification step' },
  // Tool errors
  { pattern: /tool.*not found|unknown.*tool|invalid.*tool/i, module: 'tool', severity: 'high', recoverability: 'fatal', suggestedFix: 'Verify tool registration and agent tool permissions' },
  { pattern: /tool.*timeout|execution.*timeout/i, module: 'tool', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Increase tool timeout or optimize tool execution' },
  { pattern: /tool.*permission|unauthorized.*tool/i, module: 'tool', severity: 'high', recoverability: 'fatal', suggestedFix: 'Update agent tool permissions in registry' },
  // Planning errors
  { pattern: /plan.*fail|no.*plan|planning.*error/i, module: 'planning', severity: 'high', recoverability: 'retriable', suggestedFix: 'Simplify task or provide more context for planning' },
  { pattern: /infinite.*loop|max.*iterations|stuck/i, module: 'planning', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Add iteration limits and loop detection' },
  { pattern: /deadlock|circular.*dependency/i, module: 'planning', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Restructure agent dependencies to break cycle' },
  // Hierarchy errors
  { pattern: /delegation.*fail|cannot.*delegate/i, module: 'hierarchy', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check target agent availability and delegation permissions' },
  { pattern: /escalation.*fail|no.*parent|orphan.*agent/i, module: 'hierarchy', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Verify agent hierarchy configuration' },
  { pattern: /hierarchy.*loop|circular.*hierarchy/i, module: 'hierarchy', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Fix circular hierarchy reference in agent registry' },
  // CRM errors
  { pattern: /lead.*not found|contact.*missing/i, module: 'crm', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Verify CRM data sync and lead existence' },
  { pattern: /pipeline.*stall|deal.*stuck/i, module: 'crm', severity: 'medium', recoverability: 'clarification', suggestedFix: 'Review pipeline stage rules and automation triggers' },
  { pattern: /duplicate.*lead|merge.*conflict/i, module: 'crm', severity: 'low', recoverability: 'retriable', suggestedFix: 'Run deduplication and merge conflicting records' },
  // Content errors
  { pattern: /content.*reject|approval.*denied/i, module: 'content', severity: 'medium', recoverability: 'clarification', suggestedFix: 'Review content guidelines and resubmit with corrections' },
  { pattern: /publish.*fail|posting.*error/i, module: 'content', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check platform API credentials and rate limits' },
  { pattern: /content.*policy|violation|flagged/i, module: 'content', severity: 'high', recoverability: 'fatal', suggestedFix: 'Review content against platform policies before resubmitting' },
  // Security errors
  { pattern: /auth.*fail|unauthorized|403|401/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Refresh authentication tokens or check permissions' },
  { pattern: /injection|xss|sql.*inject/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Sanitize inputs and add security validation layer' },
  { pattern: /prompt.*inject|jailbreak/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Add prompt injection detection and input sanitization' },
  // Communication errors
  { pattern: /network.*error|connection.*refused|ECONNREFUSED/i, module: 'communication', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check network connectivity and retry with backoff' },
  { pattern: /timeout|ETIMEDOUT/i, module: 'communication', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Increase timeout or check service health' },
  // Workflow errors
  { pattern: /workflow.*fail|pipeline.*break/i, module: 'workflow', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check workflow step dependencies and retry from last checkpoint' },
  { pattern: /cron.*fail|schedule.*error/i, module: 'workflow', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Verify cron expression and scheduled task configuration' },
];

// ═══════════════════════════════════════════════════════════════
// FAILURE PREDICTION PATTERNS
// ═══════════════════════════════════════════════════════════════

const PREDICTION_PATTERNS: FailurePattern[] = [
  {
    name: 'Latency Cascade',
    description: 'Increasing latency across consecutive spans predicts timeout failure',
    indicators: [
      { metric: 'span_latency_trend', condition: 'increasing', value: 0, threshold: 1.5, weight: 0.4 },
      { metric: 'avg_latency_ratio', condition: 'threshold_exceeded', value: 0, threshold: 3.0, weight: 0.3 },
      { metric: 'timeout_proximity', condition: 'threshold_exceeded', value: 0, threshold: 0.8, weight: 0.3 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 30000,
    avgConfidence: 0.7,
  },
  {
    name: 'Token Exhaustion',
    description: 'Context window approaching limit predicts truncation or model failure',
    indicators: [
      { metric: 'context_window_usage', condition: 'threshold_exceeded', value: 0, threshold: 0.85, weight: 0.5 },
      { metric: 'token_growth_rate', condition: 'increasing', value: 0, threshold: 1.2, weight: 0.3 },
      { metric: 'compression_attempts', condition: 'threshold_exceeded', value: 0, threshold: 2, weight: 0.2 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 15000,
    avgConfidence: 0.8,
  },
  {
    name: 'Error Rate Acceleration',
    description: 'Accelerating error rate predicts system-wide failure',
    indicators: [
      { metric: 'error_rate_derivative', condition: 'increasing', value: 0, threshold: 0.1, weight: 0.4 },
      { metric: 'unique_error_types', condition: 'increasing', value: 0, threshold: 3, weight: 0.3 },
      { metric: 'retry_exhaustion_rate', condition: 'threshold_exceeded', value: 0, threshold: 0.5, weight: 0.3 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 60000,
    avgConfidence: 0.75,
  },
  {
    name: 'Memory Pressure',
    description: 'Memory tier degradation predicts retrieval failures',
    indicators: [
      { metric: 'memory_stale_ratio', condition: 'threshold_exceeded', value: 0, threshold: 0.3, weight: 0.4 },
      { metric: 'retrieval_miss_rate', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'decay_acceleration', condition: 'increasing', value: 0, threshold: 1.5, weight: 0.3 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 120000,
    avgConfidence: 0.65,
  },
  {
    name: 'Reasoning Degradation',
    description: 'Cognitive fingerprint drift predicts agent reasoning failures',
    indicators: [
      { metric: 'cognitive_drift_score', condition: 'threshold_exceeded', value: 0, threshold: 25, weight: 0.4 },
      { metric: 'decision_consistency_drop', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'planning_depth_decrease', condition: 'increasing', value: 0, threshold: 0.3, weight: 0.3 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 180000,
    avgConfidence: 0.6,
  },
  {
    name: 'Hierarchy Bottleneck',
    description: 'Escalation rate spike predicts orchestrator overload',
    indicators: [
      { metric: 'escalation_rate', condition: 'threshold_exceeded', value: 0, threshold: 0.5, weight: 0.4 },
      { metric: 'delegation_failure_rate', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'queue_depth', condition: 'threshold_exceeded', value: 0, threshold: 10, weight: 0.3 },
    ],
    historicalOccurrences: 0,
    avgTimeToFailure: 45000,
    avgConfidence: 0.7,
  },
];

// ═══════════════════════════════════════════════════════════════
// BUILT-IN FLOW TESTS
// ═══════════════════════════════════════════════════════════════

function createBuiltInFlowTests(): FlowTest[] {
  return [
    // Agent domain flows
    {
      id: uid('ft'), name: 'Agent Boot → Plan → Execute → Memory Write', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Agent Initialization', description: 'Agent loads config and soul prompt', expectedOutcome: 'Agent status: ready', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Task Planning', description: 'Agent creates execution plan from input', expectedOutcome: 'Plan with ≥1 steps generated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Tool Execution', description: 'Agent executes planned tool calls', expectedOutcome: 'All tool calls return results', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Memory Persistence', description: 'Agent writes results to memory', expectedOutcome: 'Memory write confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Agent Delegation → Sub-Agent → Result Aggregation', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Delegation Decision', description: 'Orchestrator decides to delegate', expectedOutcome: 'Delegation target identified', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Sub-Agent Invocation', description: 'Sub-agent receives and processes task', expectedOutcome: 'Sub-agent returns result', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Result Aggregation', description: 'Orchestrator aggregates sub-results', expectedOutcome: 'Aggregated result available', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Error → Classification → Recovery → Escalation', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Error Occurrence', description: 'Agent encounters an error', expectedOutcome: 'Error captured in trace', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Error Classification', description: 'Error classified by module/severity', expectedOutcome: 'Classification complete', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Recovery Attempt', description: 'Agent attempts recovery based on recoverability', expectedOutcome: 'Recovery attempted or escalated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Escalation', description: 'Unrecoverable errors escalated to parent', expectedOutcome: 'Parent agent notified', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // CRM domain flows
    {
      id: uid('ft'), name: 'Lead Capture → Enrichment → Scoring → Assignment', domain: 'crm',
      steps: [
        { id: uid('fs'), name: 'Lead Capture', description: 'New lead enters the system', expectedOutcome: 'Lead record created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Data Enrichment', description: 'Lead data enriched from external sources', expectedOutcome: 'Enrichment fields populated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Lead Scoring', description: 'Lead scored based on criteria', expectedOutcome: 'Score assigned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Assignment', description: 'Lead assigned to sales rep or agent', expectedOutcome: 'Assignment confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Outreach → Response → Follow-up → Deal Creation', domain: 'crm',
      steps: [
        { id: uid('fs'), name: 'Outreach Sent', description: 'Initial outreach message sent', expectedOutcome: 'Message delivered', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Response Received', description: 'Lead responds to outreach', expectedOutcome: 'Response captured', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Follow-up Scheduled', description: 'Follow-up action scheduled', expectedOutcome: 'Follow-up in queue', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Deal Created', description: 'Qualified lead converted to deal', expectedOutcome: 'Deal record created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Content domain flows
    {
      id: uid('ft'), name: 'Content Create → Review → Approve → Publish', domain: 'content',
      steps: [
        { id: uid('fs'), name: 'Content Creation', description: 'Content generated by agent', expectedOutcome: 'Draft content available', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Quality Review', description: 'Content reviewed for quality', expectedOutcome: 'Review score ≥ threshold', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Approval', description: 'Content approved for publishing', expectedOutcome: 'Approval granted', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Publishing', description: 'Content published to platform', expectedOutcome: 'Published successfully', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Memory domain flows
    {
      id: uid('ft'), name: 'Memory Write → Retrieve → Decay → Promote', domain: 'memory',
      steps: [
        { id: uid('fs'), name: 'Memory Write', description: 'Data written to working memory', expectedOutcome: 'Write confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Memory Retrieval', description: 'Data retrieved from appropriate tier', expectedOutcome: 'Correct data returned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Decay Processing', description: 'Memory items decay over time', expectedOutcome: 'Decay applied correctly', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Tier Promotion', description: 'Important items promoted to higher tier', expectedOutcome: 'Promotion successful', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Cross-domain flows
    {
      id: uid('ft'), name: 'Agent → CRM Lead → Content → Social Post (Full Pipeline)', domain: 'all',
      steps: [
        { id: uid('fs'), name: 'Agent Task Reception', description: 'Agent receives social selling task', expectedOutcome: 'Task parsed and planned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'CRM Lead Selection', description: 'Agent selects target leads from CRM', expectedOutcome: 'Leads selected', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Content Generation', description: 'Agent generates personalized content', expectedOutcome: 'Content created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Social Publishing', description: 'Content published to social platform', expectedOutcome: 'Post published', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Result Tracking', description: 'Engagement tracked and fed back to CRM', expectedOutcome: 'Metrics recorded', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

export class CipherClawEngine {
  private sessions: Map<string, DebugSession> = new Map();
  private config: CipherClawConfig;
  private cognitiveBaselines: Map<string, CognitiveMetrics[]> = new Map();
  private soulBaselines: Map<string, SoulDimension[]> = new Map();
  private predictionHistory: FailurePrediction[] = [];
  private selfDebugLog: { timestamp: number; action: string; result: string }[] = [];

  constructor(config: Partial<CipherClawConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────

  startSession(opts: { domain?: DebugDomain; targetAgentId?: string } = {}): DebugSession {
    const session: DebugSession = {
      id: uid('sess'),
      status: 'hunting',
      domain: opts.domain ?? 'all',
      targetAgentId: opts.targetAgentId ?? null,
      startedAt: Date.now(),
      endedAt: null,
      traces: [],
      causalGraph: { nodes: [], edges: [], rootCauses: [], impactedNodes: [], criticalPath: [] },
      cognitiveFingerprints: new Map(),
      errors: [],
      breakpoints: [],
      snapshots: [],
      flowTests: createBuiltInFlowTests(),
      anomalies: [],
      anomalyCascades: [],
      predictions: [],
      soulIntegrity: new Map(),
      memoryHealth: null,
      crossDomainCorrelations: [],
      hierarchyEvents: [],
      veronicaReport: null,
      metadata: {},
    };
    this.sessions.set(session.id, session);
    this._selfDebugLog('startSession', `Session ${session.id} started for domain=${session.domain}`);
    return session;
  }

  getSession(id: string): DebugSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  pauseSession(id: string): void {
    const s = this.sessions.get(id);
    if (s && s.status === 'hunting') s.status = 'paused';
  }

  resumeSession(id: string): void {
    const s = this.sessions.get(id);
    if (s && s.status === 'paused') s.status = 'hunting';
  }

  completeSession(id: string): DebugSession | undefined {
    const s = this.sessions.get(id);
    if (!s) return undefined;
    s.status = 'completed';
    s.endedAt = Date.now();
    s.veronicaReport = this.generateVeronicaReport(id);
    return s;
  }

  // ─────────────────────────────────────────────────────────
  // TRACE INGESTION
  // ─────────────────────────────────────────────────────────

  ingestTrace(sessionId: string, trace: Trace): void {
    const s = this.sessions.get(sessionId);
    if (!s || s.status === 'completed') return;
    if (s.traces.length >= this.config.maxTraces) {
      s.traces.shift(); // FIFO eviction
    }
    s.traces.push(trace);

    // Auto-process
    if (this.config.autoClassifyErrors) {
      for (const span of trace.spans) {
        if (span.status === 'error' || span.status === 'critical') {
          const errMsg = (span.attributes['error.message'] as string) ?? span.name;
          this.classifyError(sessionId, errMsg, span);
        }
      }
    }
    if (this.config.autoBuildCausalGraph) {
      this._updateCausalGraph(s, trace);
    }
    if (this.config.autoDetectAnomalies) {
      this.detectAnomalies(sessionId, trace.spans.map(sp => ({
        id: sp.id, name: sp.name, durationMs: sp.durationMs,
      })));
    }
    if (this.config.autoPredictFailures) {
      this._runPredictions(s, trace);
    }
  }

  ingestSpan(sessionId: string, span: Span): void {
    const s = this.sessions.get(sessionId);
    if (!s || s.status === 'completed') return;

    // Find or create trace
    let trace = s.traces.find(t => t.id === span.traceId);
    if (!trace) {
      trace = {
        id: span.traceId,
        sessionId,
        rootSpanId: span.id,
        spans: [],
        startTime: span.startTime,
        endTime: span.endTime,
        durationMs: span.durationMs,
        agentId: span.agentId,
        domain: span.domain,
        status: span.status,
        totalTokens: span.tokenUsage?.total ?? 0,
        totalCost: span.cost ?? 0,
      };
      s.traces.push(trace);
    }
    trace.spans.push(span);
    trace.endTime = Math.max(trace.endTime, span.endTime);
    trace.durationMs = trace.endTime - trace.startTime;
    trace.totalTokens += span.tokenUsage?.total ?? 0;
    trace.totalCost += span.cost ?? 0;
    if (span.status === 'error' || span.status === 'critical') {
      trace.status = span.status;
    }

    // Check breakpoints
    this._checkBreakpoints(s, span);
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 1: CAUSAL DEBUG GRAPH
  // ─────────────────────────────────────────────────────────

  private _updateCausalGraph(session: DebugSession, trace: Trace): void {
    const graph = session.causalGraph;
    const spanMap = new Map<string, Span>();
    for (const span of trace.spans) {
      spanMap.set(span.id, span);
    }

    // Create nodes
    for (const span of trace.spans) {
      const existing = graph.nodes.find(n => n.spanId === span.id);
      if (existing) continue;

      const node: CausalNode = {
        id: uid('cn'),
        spanId: span.id,
        agentId: span.agentId,
        operation: span.name,
        domain: span.domain,
        timestamp: span.startTime,
        durationMs: span.durationMs,
        status: span.status,
        parents: [],
        children: [],
        rootCauseProbability: 0,
        depth: 0,
        metadata: span.attributes,
      };
      graph.nodes.push(node);
    }

    // Create edges based on parent-child span relationships
    for (const span of trace.spans) {
      if (!span.parentSpanId) continue;
      const childNode = graph.nodes.find(n => n.spanId === span.id);
      const parentNode = graph.nodes.find(n => n.spanId === span.parentSpanId);
      if (!childNode || !parentNode) continue;

      if (!parentNode.children.includes(childNode.id)) {
        parentNode.children.push(childNode.id);
      }
      if (!childNode.parents.includes(parentNode.id)) {
        childNode.parents.push(parentNode.id);
      }

      const edgeExists = graph.edges.some(e => e.from === parentNode.id && e.to === childNode.id);
      if (!edgeExists) {
        const edge: CausalEdge = {
          from: parentNode.id,
          to: childNode.id,
          type: span.status === 'error' || span.status === 'critical' ? 'error_propagation' : 'control_flow',
          weight: 1,
          latencyMs: span.startTime - (spanMap.get(span.parentSpanId)?.endTime ?? span.startTime),
        };
        graph.edges.push(edge);
      }
    }

    // Calculate depths
    this._calculateNodeDepths(graph);

    // Identify root causes (error nodes with no error parents)
    graph.rootCauses = graph.nodes
      .filter(n => (n.status === 'error' || n.status === 'critical') &&
        n.parents.every(pid => {
          const parent = graph.nodes.find(pn => pn.id === pid);
          return parent && parent.status !== 'error' && parent.status !== 'critical';
        }))
      .map(n => n.id);

    // Calculate root cause probabilities
    this._calculateRootCauseProbabilities(graph);

    // Find critical path
    graph.criticalPath = this._findCriticalPath(graph);

    // Find impacted nodes (all descendants of root cause nodes)
    const impacted = new Set<string>();
    for (const rcId of graph.rootCauses) {
      this._collectDescendants(graph, rcId, impacted);
    }
    graph.impactedNodes = Array.from(impacted);
  }

  private _calculateNodeDepths(graph: CausalGraph): void {
    const rootNodes = graph.nodes.filter(n => n.parents.length === 0);
    const visited = new Set<string>();
    const queue: { nodeId: string; depth: number }[] = rootNodes.map(n => ({ nodeId: n.id, depth: 0 }));

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      node.depth = depth;

      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push({ nodeId: childId, depth: depth + 1 });
        }
      }
    }
  }

  private _calculateRootCauseProbabilities(graph: CausalGraph): void {
    const errorNodes = graph.nodes.filter(n => n.status === 'error' || n.status === 'critical');
    if (errorNodes.length === 0) return;

    for (const node of graph.nodes) {
      if (graph.rootCauses.includes(node.id)) {
        // Root cause nodes get high probability
        const descendantErrors = this._countDescendantErrors(graph, node.id);
        node.rootCauseProbability = clamp(0.5 + (descendantErrors / errorNodes.length) * 0.5, 0, 1);
      } else if (node.status === 'error' || node.status === 'critical') {
        // Non-root error nodes get probability based on how many error parents they have
        const errorParents = node.parents.filter(pid => {
          const p = graph.nodes.find(pn => pn.id === pid);
          return p && (p.status === 'error' || p.status === 'critical');
        });
        node.rootCauseProbability = clamp(0.1 * (1 - errorParents.length / Math.max(node.parents.length, 1)), 0, 1);
      }
    }
  }

  private _countDescendantErrors(graph: CausalGraph, nodeId: string): number {
    let count = 0;
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = graph.nodes.find(n => n.id === id);
      if (!node) continue;
      if (id !== nodeId && (node.status === 'error' || node.status === 'critical')) count++;
      for (const childId of node.children) queue.push(childId);
    }
    return count;
  }

  private _findCriticalPath(graph: CausalGraph): string[] {
    // Find the longest path through error nodes
    const errorNodes = graph.nodes.filter(n => n.status === 'error' || n.status === 'critical');
    if (errorNodes.length === 0) return [];

    let longestPath: string[] = [];
    for (const rootId of graph.rootCauses) {
      const path = this._dfsLongestErrorPath(graph, rootId, new Set());
      if (path.length > longestPath.length) longestPath = path;
    }
    return longestPath;
  }

  private _dfsLongestErrorPath(graph: CausalGraph, nodeId: string, visited: Set<string>): string[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return [];

    let longest: string[] = [nodeId];
    for (const childId of node.children) {
      const childNode = graph.nodes.find(n => n.id === childId);
      if (childNode && (childNode.status === 'error' || childNode.status === 'critical')) {
        const childPath = this._dfsLongestErrorPath(graph, childId, new Set(visited));
        if (childPath.length + 1 > longest.length) {
          longest = [nodeId, ...childPath];
        }
      }
    }
    return longest;
  }

  private _collectDescendants(graph: CausalGraph, nodeId: string, collected: Set<string>): void {
    if (collected.has(nodeId)) return;
    collected.add(nodeId);
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    for (const childId of node.children) {
      this._collectDescendants(graph, childId, collected);
    }
  }

  getCausalGraph(sessionId: string): CausalGraph | undefined {
    return this.sessions.get(sessionId)?.causalGraph;
  }

  getRootCauses(sessionId: string): CausalNode[] {
    const s = this.sessions.get(sessionId);
    if (!s) return [];
    return s.causalGraph.rootCauses
      .map(id => s.causalGraph.nodes.find(n => n.id === id))
      .filter((n): n is CausalNode => n !== undefined)
      .sort((a, b) => b.rootCauseProbability - a.rootCauseProbability);
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 2: COGNITIVE FINGERPRINTING
  // ─────────────────────────────────────────────────────────

  computeCognitiveFingerprint(sessionId: string, agentId: string): CognitiveFingerprint {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    const agentSpans = s.traces
      .flatMap(t => t.spans)
      .filter(sp => sp.agentId === agentId);

    // Compute metrics
    const latencies = agentSpans.map(sp => sp.durationMs);
    const toolCalls = agentSpans.filter(sp => sp.category === 'tool_call');
    const toolNames = toolCalls.map(sp => sp.name);
    const toolFreqs = new Map<string, number>();
    for (const name of toolNames) toolFreqs.set(name, (toolFreqs.get(name) ?? 0) + 1);

    const planSpans = agentSpans.filter(sp => sp.category === 'planning');
    const memorySpans = agentSpans.filter(sp => sp.category === 'memory');
    const errorSpans = agentSpans.filter(sp => sp.status === 'error' || sp.status === 'critical');
    const recoveredSpans = agentSpans.filter(sp => sp.attributes['recovered'] === true);
    const delegationSpans = agentSpans.filter(sp => sp.category === 'delegation');
    const escalationSpans = agentSpans.filter(sp => sp.category === 'escalation');

    const totalTokens = agentSpans.reduce((s, sp) => s + (sp.tokenUsage?.total ?? 0), 0);
    const reasoningTokens = agentSpans
      .filter(sp => sp.category === 'reasoning')
      .reduce((s, sp) => s + (sp.tokenUsage?.total ?? 0), 0);

    const metrics: CognitiveMetrics = {
      avgResponseLatencyMs: mean(latencies),
      toolSelectionEntropy: entropy(Array.from(toolFreqs.values())),
      planningDepth: planSpans.length > 0 ? mean(planSpans.map(sp => (sp.attributes['depth'] as number) ?? 1)) : 0,
      reasoningTokenRatio: totalTokens > 0 ? reasoningTokens / totalTokens : 0,
      errorRecoveryRate: errorSpans.length > 0 ? recoveredSpans.length / errorSpans.length : 1,
      memoryUtilization: agentSpans.length > 0 ? memorySpans.length / agentSpans.length : 0,
      delegationFrequency: agentSpans.length > 0 ? delegationSpans.length / agentSpans.length : 0,
      escalationRate: agentSpans.length > 0 ? escalationSpans.length / agentSpans.length : 0,
      decisionConsistency: this._computeDecisionConsistency(agentSpans),
      contextWindowUsage: this._computeContextWindowUsage(agentSpans),
    };

    // Get or build baseline
    const baselines = this.cognitiveBaselines.get(agentId) ?? [];
    const baseline = baselines.length >= this.config.cognitiveBaselineSessions
      ? this._averageMetrics(baselines)
      : null;

    // Calculate drift
    const { driftScore, driftDirection, driftDetails } = baseline
      ? this._calculateDrift(metrics, baseline)
      : { driftScore: 0, driftDirection: 'unknown' as const, driftDetails: [] };

    // Store for baseline building
    baselines.push(metrics);
    if (baselines.length > this.config.cognitiveBaselineSessions * 2) baselines.shift();
    this.cognitiveBaselines.set(agentId, baselines);

    const fingerprint: CognitiveFingerprint = {
      agentId,
      sessionId,
      timestamp: Date.now(),
      metrics,
      baseline,
      driftScore,
      driftDirection,
      driftDetails,
    };

    s.cognitiveFingerprints.set(agentId, fingerprint);
    return fingerprint;
  }

  private _computeDecisionConsistency(spans: Span[]): number {
    // Measure how consistent tool selection is for similar inputs
    const decisions = spans.filter(sp => sp.category === 'tool_call');
    if (decisions.length < 2) return 1;
    const toolSequences: string[] = [];
    for (let i = 0; i < decisions.length - 1; i++) {
      toolSequences.push(`${decisions[i].name}->${decisions[i + 1].name}`);
    }
    const uniqueSeqs = new Set(toolSequences).size;
    return 1 - (uniqueSeqs / toolSequences.length);
  }

  private _computeContextWindowUsage(spans: Span[]): number {
    const maxTokens = spans
      .map(sp => sp.tokenUsage?.total ?? 0)
      .reduce((max, v) => Math.max(max, v), 0);
    // Assume 128k context window as default
    return maxTokens / 128000;
  }

  private _averageMetrics(metricsList: CognitiveMetrics[]): CognitiveMetrics {
    const keys = Object.keys(metricsList[0]) as (keyof CognitiveMetrics)[];
    const result: Record<string, number> = {};
    for (const key of keys) {
      result[key] = mean(metricsList.map(m => m[key]));
    }
    return result as unknown as CognitiveMetrics;
  }

  private _calculateDrift(
    current: CognitiveMetrics,
    baseline: CognitiveMetrics,
  ): { driftScore: number; driftDirection: 'improving' | 'degrading' | 'stable'; driftDetails: CognitiveFingerprint['driftDetails'] } {
    const details: CognitiveFingerprint['driftDetails'] = [];
    const keys = Object.keys(current) as (keyof CognitiveMetrics)[];
    let totalDrift = 0;
    let improvingCount = 0;
    let degradingCount = 0;

    // Define which direction is "improving" for each metric
    const higherIsBetter: Record<string, boolean> = {
      errorRecoveryRate: true,
      decisionConsistency: true,
      planningDepth: true,
      reasoningTokenRatio: true,
    };
    const lowerIsBetter: Record<string, boolean> = {
      avgResponseLatencyMs: true,
      escalationRate: true,
    };

    for (const key of keys) {
      const baseVal = baseline[key];
      const currVal = current[key];
      if (baseVal === 0) continue;

      const delta = (currVal - baseVal) / baseVal;
      const absDelta = Math.abs(delta) * 100;
      totalDrift += absDelta;

      let severity: Severity = 'info';
      if (absDelta > 50) severity = 'critical';
      else if (absDelta > 30) severity = 'high';
      else if (absDelta > 15) severity = 'medium';
      else if (absDelta > 5) severity = 'low';

      if (severity !== 'info') {
        details.push({ metric: key, delta: delta * 100, severity });
      }

      if (higherIsBetter[key]) {
        if (delta > 0.05) improvingCount++;
        else if (delta < -0.05) degradingCount++;
      } else if (lowerIsBetter[key]) {
        if (delta < -0.05) improvingCount++;
        else if (delta > 0.05) degradingCount++;
      }
    }

    const driftScore = clamp(totalDrift / keys.length, 0, 100);
    const driftDirection = improvingCount > degradingCount ? 'improving'
      : degradingCount > improvingCount ? 'degrading'
      : 'stable';

    return { driftScore, driftDirection, driftDetails: details };
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 3: HIERARCHICAL DEBUG PROPAGATION
  // ─────────────────────────────────────────────────────────

  propagateDebugEvent(
    sessionId: string,
    event: Omit<HierarchyDebugEvent, 'id' | 'timestamp'>,
  ): HierarchyDebugEvent {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    const fullEvent: HierarchyDebugEvent = {
      ...event,
      id: uid('hde'),
      timestamp: Date.now(),
    };

    s.hierarchyEvents.push(fullEvent);

    // Auto-escalate critical errors upward
    if (fullEvent.eventType === 'error_escalation' && fullEvent.direction === 'up') {
      this._selfDebugLog('hierarchyPropagation',
        `Error escalated from ${fullEvent.sourceAgentId} (L${fullEvent.sourceLevel}) to ${fullEvent.targetAgentId} (L${fullEvent.targetLevel})`);
    }

    return fullEvent;
  }

  getHierarchyEvents(sessionId: string): HierarchyDebugEvent[] {
    return this.sessions.get(sessionId)?.hierarchyEvents ?? [];
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 4: MEMORY TIER DEBUGGING
  // ─────────────────────────────────────────────────────────

  analyzeMemoryHealth(
    sessionId: string,
    memoryState: Record<MemoryTier, { items: unknown[]; decayRates: number[]; retrievalHits: number; retrievalMisses: number }>,
  ): MemoryHealthReport {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    const tiers: Record<MemoryTier, MemoryTierHealth> = {} as Record<MemoryTier, MemoryTierHealth>;
    const issues: MemoryIssue[] = [];
    const recommendations: string[] = [];
    const allTiers: MemoryTier[] = ['working', 'short_term', 'episodic', 'semantic', 'archival'];

    for (const tier of allTiers) {
      const state = memoryState[tier];
      if (!state) {
        tiers[tier] = {
          tier, itemCount: 0, avgDecayRate: 0, retrievalAccuracy: 1,
          promotionRate: 0, demotionRate: 0, staleItemCount: 0, coherenceScore: 1, health: 100,
        };
        continue;
      }

      const avgDecay = mean(state.decayRates);
      const totalRetrievals = state.retrievalHits + state.retrievalMisses;
      const retrievalAccuracy = totalRetrievals > 0 ? state.retrievalHits / totalRetrievals : 1;
      const staleCount = state.decayRates.filter(d => d > 0.8).length;
      const coherenceScore = 1 - (staleCount / Math.max(state.items.length, 1));

      let health = 100;
      if (retrievalAccuracy < 0.5) health -= 30;
      else if (retrievalAccuracy < 0.8) health -= 15;
      if (staleCount > state.items.length * 0.3) health -= 20;
      if (avgDecay > 0.6) health -= 15;
      if (coherenceScore < 0.5) health -= 20;

      tiers[tier] = {
        tier,
        itemCount: state.items.length,
        avgDecayRate: avgDecay,
        retrievalAccuracy,
        promotionRate: 0,
        demotionRate: 0,
        staleItemCount: staleCount,
        coherenceScore,
        health: clamp(health, 0, 100),
      };

      // Detect issues
      if (retrievalAccuracy < 0.5) {
        issues.push({
          tier, type: 'retrieval_failure', severity: 'high',
          description: `${tier} memory retrieval accuracy is ${(retrievalAccuracy * 100).toFixed(1)}%`,
          affectedItems: state.retrievalMisses,
        });
      }
      if (staleCount > state.items.length * 0.3) {
        issues.push({
          tier, type: 'stale_data', severity: 'medium',
          description: `${staleCount} stale items in ${tier} memory (${((staleCount / state.items.length) * 100).toFixed(1)}%)`,
          affectedItems: staleCount,
        });
      }
      if (coherenceScore < 0.5) {
        issues.push({
          tier, type: 'coherence_break', severity: 'high',
          description: `${tier} memory coherence score is ${(coherenceScore * 100).toFixed(1)}%`,
          affectedItems: state.items.length,
        });
      }
    }

    // Generate recommendations
    if (issues.some(i => i.type === 'retrieval_failure')) {
      recommendations.push('Rebuild memory retrieval indices for affected tiers');
    }
    if (issues.some(i => i.type === 'stale_data')) {
      recommendations.push('Run memory garbage collection to prune stale items');
    }
    if (issues.some(i => i.type === 'coherence_break')) {
      recommendations.push('Run cross-tier coherence reconciliation');
    }

    const overallHealth = mean(allTiers.map(t => tiers[t].health));

    const report: MemoryHealthReport = {
      timestamp: Date.now(),
      tiers,
      overallHealth,
      issues,
      recommendations,
    };

    s.memoryHealth = report;
    return report;
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 5: PREDICTIVE FAILURE ENGINE
  // ─────────────────────────────────────────────────────────

  private _runPredictions(session: DebugSession, trace: Trace): void {
    for (const pattern of PREDICTION_PATTERNS) {
      const confidence = this._evaluatePattern(session, trace, pattern);
      if (confidence > 0.5) {
        const prediction: FailurePrediction = {
          id: uid('pred'),
          timestamp: Date.now(),
          predictedFailureType: pattern.name,
          confidence,
          timeToFailureMs: pattern.avgTimeToFailure * (1 - confidence),
          evidenceSpanIds: trace.spans.slice(-3).map(sp => sp.id),
          suggestedAction: pattern.description,
          domain: session.domain,
          agentId: trace.agentId,
          pattern,
          resolved: false,
        };
        session.predictions.push(prediction);
        this.predictionHistory.push(prediction);
      }
    }
  }

  private _evaluatePattern(session: DebugSession, trace: Trace, pattern: FailurePattern): number {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const indicator of pattern.indicators) {
      totalWeight += indicator.weight;
      const value = this._getIndicatorValue(session, trace, indicator.metric);
      indicator.value = value;

      let match = false;
      switch (indicator.condition) {
        case 'increasing':
          match = value > indicator.threshold;
          break;
        case 'decreasing':
          match = value < indicator.threshold;
          break;
        case 'threshold_exceeded':
          match = value > indicator.threshold;
          break;
        case 'pattern_match':
          match = value > 0;
          break;
      }

      if (match) {
        weightedScore += indicator.weight;
      }
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private _getIndicatorValue(session: DebugSession, trace: Trace, metric: string): number {
    switch (metric) {
      case 'span_latency_trend': {
        const latencies = trace.spans.map(sp => sp.durationMs);
        if (latencies.length < 3) return 0;
        const recent = mean(latencies.slice(-3));
        const earlier = mean(latencies.slice(0, -3));
        return earlier > 0 ? recent / earlier : 0;
      }
      case 'avg_latency_ratio': {
        const allLatencies = session.traces.flatMap(t => t.spans.map(sp => sp.durationMs));
        const avg = mean(allLatencies);
        const traceAvg = mean(trace.spans.map(sp => sp.durationMs));
        return avg > 0 ? traceAvg / avg : 0;
      }
      case 'timeout_proximity':
        return trace.durationMs / 30000; // 30s default timeout
      case 'context_window_usage': {
        const maxTokens = Math.max(...trace.spans.map(sp => sp.tokenUsage?.total ?? 0));
        return maxTokens / 128000;
      }
      case 'token_growth_rate': {
        const tokenCounts = trace.spans
          .filter(sp => sp.tokenUsage)
          .map(sp => sp.tokenUsage!.total);
        if (tokenCounts.length < 2) return 0;
        const recent = mean(tokenCounts.slice(-2));
        const earlier = mean(tokenCounts.slice(0, -2));
        return earlier > 0 ? recent / earlier : 0;
      }
      case 'error_rate_derivative': {
        const recentErrors = session.errors.filter(e => Date.now() - e.timestamp < 60000).length;
        const olderErrors = session.errors.filter(e => {
          const age = Date.now() - e.timestamp;
          return age >= 60000 && age < 120000;
        }).length;
        return olderErrors > 0 ? (recentErrors - olderErrors) / olderErrors : recentErrors > 0 ? 1 : 0;
      }
      case 'unique_error_types': {
        const recentErrors = session.errors.filter(e => Date.now() - e.timestamp < 60000);
        return new Set(recentErrors.map(e => e.module)).size;
      }
      case 'cognitive_drift_score': {
        const fingerprints = Array.from(session.cognitiveFingerprints.values());
        return fingerprints.length > 0 ? Math.max(...fingerprints.map(f => f.driftScore)) : 0;
      }
      default:
        return 0;
    }
  }

  getPredictions(sessionId: string): FailurePrediction[] {
    return this.sessions.get(sessionId)?.predictions ?? [];
  }

  resolvePrediction(sessionId: string, predictionId: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    const pred = s.predictions.find(p => p.id === predictionId);
    if (pred) pred.resolved = true;
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 6: SOUL INTEGRITY MONITOR
  // ─────────────────────────────────────────────────────────

  analyzeSoulIntegrity(
    sessionId: string,
    agentId: string,
    soulPrompt: { personality: string[]; values: string[]; style: string },
    observedBehavior: { responses: string[]; decisions: string[]; tone: string },
  ): SoulIntegrityReport {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    const dimensions: SoulDimension[] = [];
    const driftEvents: SoulDriftEvent[] = [];

    // Analyze personality adherence
    const personalityScore = this._scoreSoulDimension(
      soulPrompt.personality, observedBehavior.responses, 'personality',
    );
    dimensions.push(personalityScore);

    // Analyze value adherence
    const valueScore = this._scoreSoulDimension(
      soulPrompt.values, observedBehavior.decisions, 'values',
    );
    dimensions.push(valueScore);

    // Analyze style consistency
    const styleScore: SoulDimension = {
      name: 'communication_style',
      baselineValue: 100,
      currentValue: this._scoreStyleConsistency(soulPrompt.style, observedBehavior.tone),
      drift: 0,
      severity: 'info',
    };
    styleScore.drift = styleScore.baselineValue - styleScore.currentValue;
    styleScore.severity = styleScore.drift > 30 ? 'critical'
      : styleScore.drift > 20 ? 'high'
      : styleScore.drift > 10 ? 'medium'
      : styleScore.drift > 5 ? 'low'
      : 'info';
    dimensions.push(styleScore);

    // Check for drift events against baseline
    const existingBaseline = this.soulBaselines.get(agentId);
    if (existingBaseline) {
      for (let i = 0; i < dimensions.length; i++) {
        const baseline = existingBaseline[i];
        const current = dimensions[i];
        if (baseline && Math.abs(current.currentValue - baseline.currentValue) > this.config.soulDriftThreshold) {
          driftEvents.push({
            timestamp: Date.now(),
            dimension: current.name,
            previousValue: baseline.currentValue,
            newValue: current.currentValue,
            trigger: 'behavioral_shift_detected',
            spanId: null,
          });
        }
      }
    }
    this.soulBaselines.set(agentId, dimensions);

    const overallScore = mean(dimensions.map(d => d.currentValue));
    const recommendations: string[] = [];
    if (overallScore < 70) recommendations.push('Soul prompt may need reinforcement — agent is drifting from defined personality');
    if (dimensions.some(d => d.severity === 'critical')) recommendations.push('Critical soul drift detected — consider resetting agent context');
    if (driftEvents.length > 0) recommendations.push(`${driftEvents.length} drift event(s) detected since last check`);

    const report: SoulIntegrityReport = {
      agentId,
      timestamp: Date.now(),
      overallScore,
      dimensions,
      driftEvents,
      recommendations,
    };

    s.soulIntegrity.set(agentId, report);
    return report;
  }

  private _scoreSoulDimension(
    expected: string[], observed: string[], name: string,
  ): SoulDimension {
    // Simple keyword matching score (in production, use LLM-based evaluation)
    const expectedLower = expected.map(e => e.toLowerCase());
    let matches = 0;
    for (const obs of observed) {
      const obsLower = obs.toLowerCase();
      for (const exp of expectedLower) {
        if (obsLower.includes(exp)) { matches++; break; }
      }
    }
    const score = observed.length > 0 ? (matches / observed.length) * 100 : 100;
    const drift = 100 - score;
    const severity: Severity = drift > 30 ? 'critical' : drift > 20 ? 'high' : drift > 10 ? 'medium' : drift > 5 ? 'low' : 'info';

    return { name, baselineValue: 100, currentValue: score, drift, severity };
  }

  private _scoreStyleConsistency(expectedStyle: string, observedTone: string): number {
    // Simple heuristic: check if observed tone matches expected style
    const styleLower = expectedStyle.toLowerCase();
    const toneLower = observedTone.toLowerCase();
    if (toneLower.includes(styleLower) || styleLower.includes(toneLower)) return 95;
    // Check for opposing tones
    const opposites: Record<string, string[]> = {
      'formal': ['casual', 'informal', 'slang'],
      'casual': ['formal', 'stiff', 'rigid'],
      'friendly': ['hostile', 'cold', 'distant'],
      'technical': ['simple', 'basic', 'layman'],
    };
    for (const [style, opps] of Object.entries(opposites)) {
      if (styleLower.includes(style) && opps.some(o => toneLower.includes(o))) return 30;
    }
    return 70; // neutral
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 7: CROSS-DOMAIN CORRELATION
  // ─────────────────────────────────────────────────────────

  detectCrossDomainCorrelations(sessionId: string): CrossDomainCorrelation[] {
    const s = this.sessions.get(sessionId);
    if (!s) return [];

    const correlations: CrossDomainCorrelation[] = [];
    const domainErrors = new Map<DebugDomain, ClassifiedError[]>();

    // Group errors by domain
    for (const err of s.errors) {
      const existing = domainErrors.get(err.domain) ?? [];
      existing.push(err);
      domainErrors.set(err.domain, existing);
    }

    // Find temporal correlations between domains
    const domains = Array.from(domainErrors.keys());
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const d1Errors = domainErrors.get(domains[i])!;
        const d2Errors = domainErrors.get(domains[j])!;

        // Check if errors in domain 1 temporally precede errors in domain 2
        let correlatedPairs = 0;
        for (const e1 of d1Errors) {
          for (const e2 of d2Errors) {
            const timeDiff = Math.abs(e1.timestamp - e2.timestamp);
            if (timeDiff < this.config.cascadeWindowMs) {
              correlatedPairs++;
            }
          }
        }

        if (correlatedPairs > 0) {
          const strength = correlatedPairs / Math.max(d1Errors.length, d2Errors.length);
          if (strength > 0.3) {
            correlations.push({
              id: uid('cdc'),
              timestamp: Date.now(),
              domains: [domains[i], domains[j]],
              correlationType: 'temporal',
              strength,
              sourceEvents: [
                ...d1Errors.slice(0, 3).map(e => ({ domain: domains[i], spanId: e.spanId ?? '', description: e.message })),
                ...d2Errors.slice(0, 3).map(e => ({ domain: domains[j], spanId: e.spanId ?? '', description: e.message })),
              ],
              description: `${correlatedPairs} temporally correlated errors between ${domains[i]} and ${domains[j]} domains`,
              suggestedAction: `Investigate shared dependencies between ${domains[i]} and ${domains[j]} pipelines`,
            });
          }
        }
      }
    }

    s.crossDomainCorrelations = correlations;
    return correlations;
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 8: SELF-DEBUGGING AGENT LOOP
  // ─────────────────────────────────────────────────────────

  selfDebug(): { healthy: boolean; issues: string[]; actions: string[] } {
    const issues: string[] = [];
    const actions: string[] = [];

    // Check engine health
    if (this.sessions.size > 100) {
      issues.push(`High session count: ${this.sessions.size}`);
      actions.push('Prune completed sessions older than 24h');
    }

    // Check for stuck sessions
    for (const [id, session] of this.sessions) {
      if (session.status === 'hunting' && Date.now() - session.startedAt > 3600000) {
        issues.push(`Session ${id} has been hunting for >1 hour`);
        actions.push(`Force-complete session ${id}`);
      }
    }

    // Check prediction accuracy
    const resolvedPredictions = this.predictionHistory.filter(p => p.resolved);
    if (resolvedPredictions.length > 10) {
      const accuracy = resolvedPredictions.filter(p => p.confidence > 0.7).length / resolvedPredictions.length;
      if (accuracy < 0.5) {
        issues.push(`Prediction accuracy is low: ${(accuracy * 100).toFixed(1)}%`);
        actions.push('Recalibrate prediction thresholds');
      }
    }

    // Check self-debug log for repeated errors
    const recentLogs = this.selfDebugLog.filter(l => Date.now() - l.timestamp < 300000);
    const errorLogs = recentLogs.filter(l => l.result.includes('error') || l.result.includes('fail'));
    if (errorLogs.length > 5) {
      issues.push(`${errorLogs.length} self-debug errors in last 5 minutes`);
      actions.push('Review self-debug log for recurring patterns');
    }

    const healthy = issues.length === 0;
    this._selfDebugLog('selfDebug', healthy ? 'All systems nominal' : `${issues.length} issues found`);

    return { healthy, issues, actions };
  }

  private _selfDebugLog(action: string, result: string): void {
    this.selfDebugLog.push({ timestamp: Date.now(), action, result });
    // Keep last 1000 entries
    if (this.selfDebugLog.length > 1000) this.selfDebugLog.shift();
  }

  getSelfDebugLog(): typeof this.selfDebugLog {
    return [...this.selfDebugLog];
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 9: FLOW TEST SYNTHESIS
  // ─────────────────────────────────────────────────────────

  synthesizeFlowTest(sessionId: string, traceId: string): FlowTest | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;

    const trace = s.traces.find(t => t.id === traceId);
    if (!trace || trace.spans.length === 0) return null;

    // Build steps from span sequence
    const rootSpans = trace.spans.filter(sp => !sp.parentSpanId);
    const steps: FlowTestStep[] = [];

    for (const span of trace.spans) {
      steps.push({
        id: uid('fs'),
        name: span.name,
        description: `${span.category}: ${span.name} (${span.durationMs}ms)`,
        expectedOutcome: span.status === 'ok' || span.status === 'warning' ? 'success' : 'error',
        actualOutcome: null,
        status: 'pending',
        durationMs: null,
        assertions: [
          { description: `Status should be ${span.status}`, expected: span.status, actual: null, passed: false },
          { description: `Duration should be < ${span.durationMs * 2}ms`, expected: span.durationMs * 2, actual: null, passed: false },
        ],
      });
    }

    const flowTest: FlowTest = {
      id: uid('ft'),
      name: `Synthesized: ${trace.spans[0]?.name ?? 'Unknown'} flow`,
      domain: trace.domain,
      steps,
      synthesizedFrom: traceId,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      coverage: 0,
    };

    s.flowTests.push(flowTest);
    return flowTest;
  }

  runFlowTests(sessionId: string, domain?: DebugDomain): { total: number; passed: number; failed: number; coverage: number } {
    const s = this.sessions.get(sessionId);
    if (!s) return { total: 0, passed: 0, failed: 0, coverage: 0 };

    const tests = domain ? s.flowTests.filter(ft => ft.domain === domain || ft.domain === 'all') : s.flowTests;
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      test.startedAt = Date.now();
      test.status = 'running';

      let stepsPassed = 0;
      for (const step of test.steps) {
        step.status = 'running';
        // Simulate test execution against collected traces
        const matchingSpan = s.traces
          .flatMap(t => t.spans)
          .find(sp => sp.name.includes(step.name) || step.name.includes(sp.name));

        if (matchingSpan) {
          step.actualOutcome = matchingSpan.status;
          step.durationMs = matchingSpan.durationMs;
          step.status = (matchingSpan.status === 'ok' || matchingSpan.status === 'warning') ? 'passed' : 'failed';
          for (const assertion of step.assertions) {
            assertion.actual = matchingSpan.status;
            assertion.passed = assertion.expected === matchingSpan.status ||
              (typeof assertion.expected === 'number' && matchingSpan.durationMs < (assertion.expected as number));
          }
        } else {
          step.status = 'skipped';
          step.actualOutcome = 'no matching span found';
        }

        if (step.status === 'passed') stepsPassed++;
      }

      test.coverage = test.steps.length > 0 ? stepsPassed / test.steps.length : 0;
      test.completedAt = Date.now();
      test.status = stepsPassed === test.steps.length ? 'passed' : 'failed';

      if (test.status === 'passed') passed++;
      else failed++;
    }

    const totalCoverage = tests.length > 0 ? mean(tests.map(t => t.coverage)) : 0;
    return { total: tests.length, passed, failed, coverage: totalCoverage };
  }

  // ─────────────────────────────────────────────────────────
  // CAPABILITY 10: TEMPORAL ANOMALY CASCADE DETECTION
  // ─────────────────────────────────────────────────────────

  detectAnomalies(
    sessionId: string,
    spans: { id: string; name: string; durationMs: number }[],
  ): Anomaly[] {
    const s = this.sessions.get(sessionId);
    if (!s) return [];

    const newAnomalies: Anomaly[] = [];
    const durations = spans.map(sp => sp.durationMs);
    const m = mean(durations);
    const sd = stddev(durations);

    if (sd === 0) return [];

    // Latency spike detection
    for (const span of spans) {
      const zScore = Math.abs((span.durationMs - m) / sd);
      if (zScore > this.config.anomalyThresholdStdDev) {
        newAnomalies.push({
          id: uid('anom'),
          type: 'latency_spike',
          severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
          timestamp: Date.now(),
          domain: s.domain,
          agentId: null,
          spanId: span.id,
          description: `Latency spike: ${span.name} took ${span.durationMs}ms (${zScore.toFixed(1)}σ from mean ${m.toFixed(0)}ms)`,
          value: span.durationMs,
          expectedRange: { min: m - sd * 2, max: m + sd * 2 },
          cascadeId: null,
          cascadePosition: 0,
        });
      }
    }

    // Error burst detection
    const recentErrors = s.errors.filter(e => Date.now() - e.timestamp < 60000);
    if (recentErrors.length > 5) {
      newAnomalies.push({
        id: uid('anom'),
        type: 'error_burst',
        severity: recentErrors.length > 20 ? 'critical' : recentErrors.length > 10 ? 'high' : 'medium',
        timestamp: Date.now(),
        domain: s.domain,
        agentId: null,
        spanId: null,
        description: `Error burst: ${recentErrors.length} errors in last 60 seconds`,
        value: recentErrors.length,
        expectedRange: { min: 0, max: 5 },
        cascadeId: null,
        cascadePosition: 0,
      });
    }

    // Add to session and detect cascades
    s.anomalies.push(...newAnomalies);
    this._detectCascades(s);

    return newAnomalies;
  }

  private _detectCascades(session: DebugSession): void {
    const recentAnomalies = session.anomalies.filter(
      a => !a.cascadeId && Date.now() - a.timestamp < this.config.cascadeWindowMs,
    );

    if (recentAnomalies.length < 3) return;

    // Group by time proximity
    const sorted = [...recentAnomalies].sort((a, b) => a.timestamp - b.timestamp);
    const cascadeGroups: Anomaly[][] = [];
    let currentGroup: Anomaly[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].timestamp - sorted[i - 1].timestamp < this.config.cascadeWindowMs / 3) {
        currentGroup.push(sorted[i]);
      } else {
        if (currentGroup.length >= 3) cascadeGroups.push(currentGroup);
        currentGroup = [sorted[i]];
      }
    }
    if (currentGroup.length >= 3) cascadeGroups.push(currentGroup);

    // Create cascade records
    for (const group of cascadeGroups) {
      const cascadeId = uid('casc');
      const cascade: AnomalyCascade = {
        id: cascadeId,
        rootAnomalyId: group[0].id,
        anomalyIds: group.map(a => a.id),
        startTime: group[0].timestamp,
        endTime: group[group.length - 1].timestamp,
        affectedDomains: [...new Set(group.map(a => a.domain))],
        affectedAgents: [...new Set(group.filter(a => a.agentId).map(a => a.agentId!))],
        severity: group.some(a => a.severity === 'critical') ? 'critical'
          : group.some(a => a.severity === 'high') ? 'high' : 'medium',
        description: `Anomaly cascade: ${group.length} anomalies over ${group[group.length - 1].timestamp - group[0].timestamp}ms`,
      };

      // Mark anomalies as part of cascade
      for (let i = 0; i < group.length; i++) {
        group[i].cascadeId = cascadeId;
        group[i].cascadePosition = i;
      }

      session.anomalyCascades.push(cascade);
    }
  }

  // ─────────────────────────────────────────────────────────
  // ERROR CLASSIFICATION
  // ─────────────────────────────────────────────────────────

  classifyError(sessionId: string, message: string, span?: Partial<Span>): ClassifiedError {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    let module: ErrorModule = 'system';
    let severity: Severity = 'medium';
    let recoverability: Recoverability = 'retriable';
    let suggestedFix = 'Review error logs and retry operation';

    // Match against patterns
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(message)) {
        module = pattern.module;
        severity = pattern.severity;
        recoverability = pattern.recoverability;
        suggestedFix = pattern.suggestedFix;
        break;
      }
    }

    // Override with span category if available
    if (span?.category) {
      const categoryMap: Record<string, ErrorModule> = {
        'memory': 'memory', 'tool_call': 'tool', 'planning': 'planning',
        'delegation': 'hierarchy', 'escalation': 'hierarchy',
        'crm': 'crm', 'content': 'content', 'security': 'security',
      };
      if (categoryMap[span.category]) module = categoryMap[span.category];
    }

    const error: ClassifiedError = {
      id: uid('err'),
      timestamp: Date.now(),
      message,
      stack: null,
      module,
      severity,
      recoverability,
      domain: span?.domain ?? s.domain,
      agentId: span?.agentId ?? null,
      spanId: span?.id ?? null,
      rootCauseNodeId: null,
      suggestedFix,
      retryCount: 0,
      resolved: false,
    };

    s.errors.push(error);
    return error;
  }

  // ─────────────────────────────────────────────────────────
  // BREAKPOINTS
  // ─────────────────────────────────────────────────────────

  addBreakpoint(sessionId: string, type: BreakpointType, condition?: string, metadata?: Record<string, unknown>): Breakpoint {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

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

    s.breakpoints.push(bp);
    return bp;
  }

  removeBreakpoint(sessionId: string, breakpointId: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.breakpoints = s.breakpoints.filter(bp => bp.id !== breakpointId);
  }

  toggleBreakpoint(sessionId: string, breakpointId: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    const bp = s.breakpoints.find(b => b.id === breakpointId);
    if (bp) bp.enabled = !bp.enabled;
  }

  private _checkBreakpoints(session: DebugSession, span: Span): void {
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
        this._captureSnapshot(session, `breakpoint:${bp.type}`, bp.id, span.id);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STATE SNAPSHOTS & REPLAY
  // ─────────────────────────────────────────────────────────

  private _captureSnapshot(session: DebugSession, triggeredBy: string, breakpointId: string | null, spanId: string | null): StateSnapshot {
    if (session.snapshots.length >= this.config.maxSnapshots) {
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

  captureManualSnapshot(sessionId: string): StateSnapshot | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return this._captureSnapshot(s, 'manual', null, null);
  }

  getSnapshots(sessionId: string): StateSnapshot[] {
    return this.sessions.get(sessionId)?.snapshots ?? [];
  }

  replayToSnapshot(sessionId: string, snapshotId: string): StateSnapshot | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    const snapshot = s.snapshots.find(sn => sn.id === snapshotId);
    if (!snapshot) return null;

    // Mark session as paused at this point
    s.status = 'paused';
    s.metadata['replayTarget'] = snapshotId;
    s.metadata['replayTimestamp'] = snapshot.timestamp;

    this._selfDebugLog('replay', `Replaying to snapshot ${snapshotId} at ${new Date(snapshot.timestamp).toISOString()}`);
    return snapshot;
  }

  // ─────────────────────────────────────────────────────────
  // VERONICA REPORT GENERATION
  // ─────────────────────────────────────────────────────────

  generateVeronicaReport(sessionId: string): VeronicaDebugReport {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);

    // Severity breakdown
    const severityBreakdown: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const err of s.errors) severityBreakdown[err.severity]++;

    // Domain breakdown
    const domainBreakdown: Record<string, { errors: number; anomalies: number; health: number }> = {};
    const allDomains: DebugDomain[] = ['agent', 'crm', 'content', 'memory', 'tool', 'hierarchy'];
    for (const domain of allDomains) {
      const domainErrors = s.errors.filter(e => e.domain === domain).length;
      const domainAnomalies = s.anomalies.filter(a => a.domain === domain).length;
      const health = 100 - (domainErrors * 5) - (domainAnomalies * 3);
      domainBreakdown[domain] = { errors: domainErrors, anomalies: domainAnomalies, health: clamp(health, 0, 100) };
    }

    // Health score calculation
    let healthScore = 100;
    healthScore -= severityBreakdown.critical * 15;
    healthScore -= severityBreakdown.high * 8;
    healthScore -= severityBreakdown.medium * 3;
    healthScore -= severityBreakdown.low * 1;
    healthScore -= s.anomalies.length * 2;
    healthScore -= s.anomalyCascades.length * 10;

    // Flow test coverage bonus/penalty
    const flowResults = this.runFlowTests(sessionId);
    if (flowResults.total > 0) {
      const coverageBonus = flowResults.coverage * 20 - 10;
      healthScore += coverageBonus;
    }

    healthScore = clamp(healthScore, 0, 100);

    // Top issues
    const topIssues = s.errors
      .reduce((acc, err) => {
        const key = `${err.module}:${err.severity}`;
        const existing = acc.find(i => i.description === err.message);
        if (existing) { existing.count++; }
        else { acc.push({ description: err.message, severity: err.severity, domain: err.domain, count: 1 }); }
        return acc;
      }, [] as VeronicaDebugReport['topIssues'])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Causal root causes
    const causalRootCauses = this.getRootCauses(sessionId).map(n => ({
      nodeId: n.id,
      description: `${n.operation} (${n.domain})`,
      probability: n.rootCauseProbability,
    }));

    // Cognitive alerts
    const cognitiveAlerts = Array.from(s.cognitiveFingerprints.values())
      .filter(f => f.driftScore > 15)
      .map(f => ({ agentId: f.agentId, driftScore: f.driftScore, direction: f.driftDirection }));

    // Soul alerts
    const soulAlerts = Array.from(s.soulIntegrity.values())
      .filter(r => r.overallScore < 80)
      .map(r => ({
        agentId: r.agentId,
        integrityScore: r.overallScore,
        driftDimensions: r.dimensions.filter(d => d.severity !== 'info').map(d => d.name),
      }));

    // Memory alerts
    const memoryAlerts = s.memoryHealth?.issues ?? [];

    // Recommendations
    const recommendations: string[] = [];
    if (severityBreakdown.critical > 0) recommendations.push(`Address ${severityBreakdown.critical} critical error(s) immediately`);
    if (s.anomalyCascades.length > 0) recommendations.push(`Investigate ${s.anomalyCascades.length} anomaly cascade(s)`);
    if (cognitiveAlerts.length > 0) recommendations.push(`Review cognitive drift in ${cognitiveAlerts.length} agent(s)`);
    if (soulAlerts.length > 0) recommendations.push(`Reinforce soul prompts for ${soulAlerts.length} agent(s)`);
    if (memoryAlerts.length > 0) recommendations.push(`Address ${memoryAlerts.length} memory health issue(s)`);
    if (s.predictions.filter(p => !p.resolved).length > 0) {
      recommendations.push(`${s.predictions.filter(p => !p.resolved).length} unresolved failure prediction(s) require attention`);
    }
    if (flowResults.coverage < 0.5) recommendations.push('Increase flow test coverage — currently below 50%');

    // Action items
    const actionItems: VeronicaDebugReport['actionItems'] = [];
    if (severityBreakdown.critical > 0) actionItems.push({ priority: 'critical', action: 'Fix critical errors', domain: 'all' });
    for (const cascade of s.anomalyCascades) {
      actionItems.push({ priority: cascade.severity, action: `Investigate cascade: ${cascade.description}`, domain: cascade.affectedDomains[0] ?? 'all' });
    }
    for (const pred of s.predictions.filter(p => !p.resolved)) {
      actionItems.push({ priority: 'high', action: `Prevent predicted failure: ${pred.predictedFailureType}`, domain: pred.domain });
    }

    const summary = healthScore >= 80
      ? `System is healthy (${healthScore}/100). ${s.errors.length} errors, ${s.anomalies.length} anomalies detected.`
      : healthScore >= 50
      ? `System needs attention (${healthScore}/100). ${severityBreakdown.critical + severityBreakdown.high} critical/high issues require action.`
      : `System is degraded (${healthScore}/100). Immediate intervention required. ${s.anomalyCascades.length} cascading failures detected.`;

    return {
      sessionId,
      generatedAt: Date.now(),
      healthScore,
      summary,
      severityBreakdown,
      domainBreakdown,
      topIssues,
      causalRootCauses,
      predictions: s.predictions.filter(p => !p.resolved),
      cognitiveAlerts,
      soulAlerts,
      memoryAlerts,
      flowTestResults: flowResults,
      recommendations,
      actionItems,
    };
  }

  // ─────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────

  getConfig(): CipherClawConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CipherClawConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // ─────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────

  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalTraces: number;
    totalErrors: number;
    totalAnomalies: number;
    totalPredictions: number;
    totalFlowTests: number;
    totalSnapshots: number;
  } {
    let totalTraces = 0, totalErrors = 0, totalAnomalies = 0;
    let totalPredictions = 0, totalFlowTests = 0, totalSnapshots = 0;
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      if (session.status === 'hunting' || session.status === 'analyzing') activeSessions++;
      totalTraces += session.traces.length;
      totalErrors += session.errors.length;
      totalAnomalies += session.anomalies.length;
      totalPredictions += session.predictions.length;
      totalFlowTests += session.flowTests.length;
      totalSnapshots += session.snapshots.length;
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      totalTraces,
      totalErrors,
      totalAnomalies,
      totalPredictions,
      totalFlowTests,
      totalSnapshots,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { ERROR_PATTERNS, PREDICTION_PATTERNS, createBuiltInFlowTests };
export { uid, mean, stddev, clamp, entropy };
