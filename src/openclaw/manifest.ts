/**
 * CipherClaw — OpenClaw Skill Manifest & Agent Definitions
 * Defines CipherClaw as an OpenClaw-compatible skill with full agent hierarchy
 *
 * Copyright 2026 ClawLI.AI / CipherClaw
 * Licensed under Apache 2.0
 */

import type { OpenClawAgentDef } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════
// OPENCLAW SKILL MANIFEST
// ═══════════════════════════════════════════════════════════════

export interface OpenClawSkillManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage: string;
  repository: string;
  category: string;
  tags: string[];
  compatibility: { openclaw: string; node: string };
  agents: OpenClawAgentDef[];
  skills: OpenClawSkillDef[];
  tools: OpenClawToolDef[];
  events: OpenClawEventDef[];
  configuration: OpenClawConfigDef[];
}

export interface OpenClawSkillDef {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredTools: string[];
  providedCapabilities: string[];
}

export interface OpenClawToolDef {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface OpenClawEventDef {
  id: string;
  name: string;
  description: string;
  payload: Record<string, unknown>;
  direction: 'emit' | 'listen' | 'both';
}

export interface OpenClawConfigDef {
  key: string;
  type: string;
  default: unknown;
  description: string;
  required: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW AGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const CIPHERCLAW_AGENTS: OpenClawAgentDef[] = [
  {
    id: 'cipherclaw-phantom',
    name: 'Phantom',
    tier: 'orchestrator',
    team: 'debug',
    parentId: 'veronica',
    skills: [
      'debug-orchestration', 'causal-analysis', 'predictive-failure',
      'cross-domain-correlation', 'self-debugging', 'report-generation',
    ],
    tools: [
      'start-debug-session', 'analyze-traces', 'generate-report',
      'predict-failures', 'correlate-domains', 'self-diagnose',
    ],
    model: { provider: 'openai', model: 'gpt-4.1-mini' },
    soul: {
      personality: ['meticulous', 'relentless', 'analytical', 'vigilant'],
      values: ['accuracy', 'thoroughness', 'zero-tolerance-for-bugs'],
      style: 'precise and technical, like a forensic investigator',
    },
  },
  {
    id: 'cipherclaw-trace-analyst',
    name: 'Trace Analyst',
    tier: 'specialist',
    team: 'debug',
    parentId: 'cipherclaw-phantom',
    skills: [
      'trace-analysis', 'causal-graph-building', 'anomaly-detection',
      'temporal-cascade-detection', 'latency-profiling',
    ],
    tools: [
      'ingest-trace', 'build-causal-graph', 'detect-anomalies',
      'detect-cascades', 'profile-latency',
    ],
    model: { provider: 'openai', model: 'gpt-4.1-nano' },
    soul: {
      personality: ['detail-oriented', 'pattern-seeking', 'systematic'],
      values: ['data-integrity', 'completeness'],
      style: 'data-driven and precise',
    },
  },
  {
    id: 'cipherclaw-error-classifier',
    name: 'Error Classifier',
    tier: 'specialist',
    team: 'debug',
    parentId: 'cipherclaw-phantom',
    skills: [
      'error-classification', 'root-cause-analysis', 'fix-suggestion',
      'recoverability-assessment', 'error-pattern-matching',
    ],
    tools: [
      'classify-error', 'find-root-cause', 'suggest-fix',
      'assess-recoverability', 'match-patterns',
    ],
    model: { provider: 'openai', model: 'gpt-4.1-nano' },
    soul: {
      personality: ['diagnostic', 'methodical', 'solution-oriented'],
      values: ['accuracy', 'actionability'],
      style: 'clinical and prescriptive',
    },
  },
  {
    id: 'cipherclaw-cognitive-profiler',
    name: 'Cognitive Profiler',
    tier: 'specialist',
    team: 'debug',
    parentId: 'cipherclaw-phantom',
    skills: [
      'cognitive-fingerprinting', 'soul-integrity-monitoring',
      'behavioral-drift-detection', 'memory-health-analysis',
    ],
    tools: [
      'compute-fingerprint', 'analyze-soul-integrity',
      'detect-drift', 'analyze-memory-health',
    ],
    model: { provider: 'openai', model: 'gpt-4.1-mini' },
    soul: {
      personality: ['empathetic', 'observant', 'psychologically-aware'],
      values: ['agent-wellbeing', 'behavioral-consistency'],
      style: 'thoughtful and nuanced',
    },
  },
  {
    id: 'cipherclaw-flow-tester',
    name: 'Flow Tester',
    tier: 'worker',
    team: 'debug',
    parentId: 'cipherclaw-phantom',
    skills: [
      'flow-test-synthesis', 'flow-test-execution',
      'coverage-analysis', 'regression-detection',
    ],
    tools: [
      'synthesize-flow-test', 'run-flow-tests',
      'analyze-coverage', 'detect-regressions',
    ],
    model: { provider: 'openai', model: 'gpt-4.1-nano' },
    soul: {
      personality: ['thorough', 'persistent', 'quality-focused'],
      values: ['coverage', 'reliability'],
      style: 'structured and report-oriented',
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW SKILL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const CIPHERCLAW_SKILLS: OpenClawSkillDef[] = [
  {
    id: 'debug-orchestration',
    name: 'Debug Orchestration',
    description: 'Coordinate multi-agent debug sessions across all domains',
    category: 'orchestration',
    requiredTools: ['start-debug-session', 'generate-report'],
    providedCapabilities: ['session-management', 'report-generation', 'debug-coordination'],
  },
  {
    id: 'causal-analysis',
    name: 'Causal Analysis',
    description: 'Build and analyze causal debug graphs to identify root causes',
    category: 'analysis',
    requiredTools: ['build-causal-graph', 'find-root-cause'],
    providedCapabilities: ['root-cause-identification', 'impact-analysis', 'critical-path-detection'],
  },
  {
    id: 'cognitive-fingerprinting',
    name: 'Cognitive Fingerprinting',
    description: 'Profile agent cognitive behavior and detect behavioral drift',
    category: 'profiling',
    requiredTools: ['compute-fingerprint', 'detect-drift'],
    providedCapabilities: ['behavioral-profiling', 'drift-detection', 'baseline-comparison'],
  },
  {
    id: 'predictive-failure',
    name: 'Predictive Failure Analysis',
    description: 'Predict failures before they occur using pattern recognition',
    category: 'prediction',
    requiredTools: ['predict-failures'],
    providedCapabilities: ['failure-prediction', 'early-warning', 'preventive-action'],
  },
  {
    id: 'soul-integrity-monitoring',
    name: 'Soul Integrity Monitoring',
    description: 'Monitor agent personality and value adherence over time',
    category: 'monitoring',
    requiredTools: ['analyze-soul-integrity'],
    providedCapabilities: ['soul-drift-detection', 'personality-adherence', 'value-alignment'],
  },
  {
    id: 'memory-health-analysis',
    name: 'Memory Health Analysis',
    description: 'Analyze multi-tier memory system health and detect issues',
    category: 'analysis',
    requiredTools: ['analyze-memory-health'],
    providedCapabilities: ['memory-diagnostics', 'tier-health', 'decay-analysis'],
  },
  {
    id: 'cross-domain-correlation',
    name: 'Cross-Domain Correlation',
    description: 'Detect correlations between errors across different system domains',
    category: 'analysis',
    requiredTools: ['correlate-domains'],
    providedCapabilities: ['cross-domain-analysis', 'correlation-detection', 'shared-dependency-identification'],
  },
  {
    id: 'flow-test-synthesis',
    name: 'Flow Test Synthesis',
    description: 'Automatically synthesize integration tests from observed traces',
    category: 'testing',
    requiredTools: ['synthesize-flow-test', 'run-flow-tests'],
    providedCapabilities: ['test-generation', 'coverage-analysis', 'regression-detection'],
  },
  {
    id: 'anomaly-cascade-detection',
    name: 'Anomaly Cascade Detection',
    description: 'Detect and track cascading anomalies across the system',
    category: 'detection',
    requiredTools: ['detect-anomalies', 'detect-cascades'],
    providedCapabilities: ['anomaly-detection', 'cascade-tracking', 'early-warning'],
  },
  {
    id: 'self-debugging',
    name: 'Self-Debugging',
    description: 'CipherClaw monitors and debugs its own operation',
    category: 'meta',
    requiredTools: ['self-diagnose'],
    providedCapabilities: ['self-monitoring', 'self-healing', 'meta-debugging'],
  },
];

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const CIPHERCLAW_TOOLS: OpenClawToolDef[] = [
  {
    id: 'start-debug-session',
    name: 'Start Debug Session',
    description: 'Initialize a new CipherClaw debug session',
    inputSchema: { type: 'object', properties: { domain: { type: 'string' }, targetAgentId: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, status: { type: 'string' } } },
  },
  {
    id: 'ingest-trace',
    name: 'Ingest Trace',
    description: 'Feed a trace into the debug engine for analysis',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, trace: { type: 'object' } }, required: ['sessionId', 'trace'] },
    outputSchema: { type: 'object', properties: { processed: { type: 'boolean' } } },
  },
  {
    id: 'build-causal-graph',
    name: 'Build Causal Graph',
    description: 'Construct a causal debug graph from session traces',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    outputSchema: { type: 'object', properties: { nodes: { type: 'number' }, edges: { type: 'number' }, rootCauses: { type: 'number' } } },
  },
  {
    id: 'classify-error',
    name: 'Classify Error',
    description: 'Classify an error by module, severity, and recoverability',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, message: { type: 'string' } }, required: ['sessionId', 'message'] },
    outputSchema: { type: 'object', properties: { module: { type: 'string' }, severity: { type: 'string' }, suggestedFix: { type: 'string' } } },
  },
  {
    id: 'compute-fingerprint',
    name: 'Compute Cognitive Fingerprint',
    description: 'Generate a cognitive behavioral fingerprint for an agent',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, agentId: { type: 'string' } }, required: ['sessionId', 'agentId'] },
    outputSchema: { type: 'object', properties: { driftScore: { type: 'number' }, direction: { type: 'string' } } },
  },
  {
    id: 'detect-anomalies',
    name: 'Detect Anomalies',
    description: 'Detect statistical anomalies in span performance data',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, spans: { type: 'array' } }, required: ['sessionId', 'spans'] },
    outputSchema: { type: 'object', properties: { anomalies: { type: 'array' } } },
  },
  {
    id: 'predict-failures',
    name: 'Predict Failures',
    description: 'Run predictive failure analysis on current session state',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    outputSchema: { type: 'object', properties: { predictions: { type: 'array' } } },
  },
  {
    id: 'analyze-soul-integrity',
    name: 'Analyze Soul Integrity',
    description: 'Check agent personality and value adherence',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, agentId: { type: 'string' }, soulPrompt: { type: 'object' }, observedBehavior: { type: 'object' } } },
    outputSchema: { type: 'object', properties: { overallScore: { type: 'number' }, driftEvents: { type: 'array' } } },
  },
  {
    id: 'analyze-memory-health',
    name: 'Analyze Memory Health',
    description: 'Analyze multi-tier memory system health',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, memoryState: { type: 'object' } } },
    outputSchema: { type: 'object', properties: { overallHealth: { type: 'number' }, issues: { type: 'array' } } },
  },
  {
    id: 'correlate-domains',
    name: 'Correlate Domains',
    description: 'Detect cross-domain error correlations',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    outputSchema: { type: 'object', properties: { correlations: { type: 'array' } } },
  },
  {
    id: 'synthesize-flow-test',
    name: 'Synthesize Flow Test',
    description: 'Auto-generate a flow test from an observed trace',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, traceId: { type: 'string' } }, required: ['sessionId', 'traceId'] },
    outputSchema: { type: 'object', properties: { flowTestId: { type: 'string' }, steps: { type: 'number' } } },
  },
  {
    id: 'run-flow-tests',
    name: 'Run Flow Tests',
    description: 'Execute all flow tests for a session',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, domain: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { total: { type: 'number' }, passed: { type: 'number' }, failed: { type: 'number' }, coverage: { type: 'number' } } },
  },
  {
    id: 'generate-report',
    name: 'Generate Veronica Report',
    description: 'Generate a comprehensive debug report for Veronica',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    outputSchema: { type: 'object', properties: { healthScore: { type: 'number' }, summary: { type: 'string' } } },
  },
  {
    id: 'self-diagnose',
    name: 'Self-Diagnose',
    description: 'CipherClaw runs self-diagnostics on its own engine',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object', properties: { healthy: { type: 'boolean' }, issues: { type: 'array' } } },
  },
];

// ═══════════════════════════════════════════════════════════════
// CIPHERCLAW EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const CIPHERCLAW_EVENTS: OpenClawEventDef[] = [
  { id: 'session-started', name: 'Debug Session Started', description: 'Emitted when a new debug session begins', payload: { sessionId: 'string', domain: 'string' }, direction: 'emit' },
  { id: 'session-completed', name: 'Debug Session Completed', description: 'Emitted when a debug session completes', payload: { sessionId: 'string', healthScore: 'number' }, direction: 'emit' },
  { id: 'error-classified', name: 'Error Classified', description: 'Emitted when an error is classified', payload: { errorId: 'string', module: 'string', severity: 'string' }, direction: 'emit' },
  { id: 'anomaly-detected', name: 'Anomaly Detected', description: 'Emitted when an anomaly is detected', payload: { anomalyId: 'string', type: 'string', severity: 'string' }, direction: 'emit' },
  { id: 'cascade-detected', name: 'Anomaly Cascade Detected', description: 'Emitted when a cascading failure is detected', payload: { cascadeId: 'string', count: 'number' }, direction: 'emit' },
  { id: 'prediction-generated', name: 'Failure Prediction Generated', description: 'Emitted when a failure is predicted', payload: { predictionId: 'string', confidence: 'number' }, direction: 'emit' },
  { id: 'breakpoint-hit', name: 'Breakpoint Hit', description: 'Emitted when a breakpoint is triggered', payload: { breakpointId: 'string', spanId: 'string' }, direction: 'emit' },
  { id: 'soul-drift-detected', name: 'Soul Drift Detected', description: 'Emitted when agent soul drift is detected', payload: { agentId: 'string', driftScore: 'number' }, direction: 'emit' },
  { id: 'cognitive-drift-detected', name: 'Cognitive Drift Detected', description: 'Emitted when agent cognitive drift is detected', payload: { agentId: 'string', driftScore: 'number' }, direction: 'emit' },
  { id: 'trace-ingested', name: 'Trace Ingested', description: 'Listens for new traces to ingest', payload: { traceId: 'string', spans: 'number' }, direction: 'listen' },
  { id: 'agent-error', name: 'Agent Error', description: 'Listens for agent errors to classify', payload: { agentId: 'string', message: 'string' }, direction: 'listen' },
  { id: 'hierarchy-event', name: 'Hierarchy Event', description: 'Listens for hierarchy debug propagation events', payload: { sourceAgentId: 'string', eventType: 'string' }, direction: 'listen' },
];

// ═══════════════════════════════════════════════════════════════
// FULL MANIFEST
// ═══════════════════════════════════════════════════════════════

export const CIPHERCLAW_MANIFEST: OpenClawSkillManifest = {
  name: 'cipherclaw',
  version: '1.0.0',
  description: 'CipherClaw — The World\'s First OpenClaw Bug Hunter AI Agent. Patent-pending debug platform with causal analysis, cognitive fingerprinting, predictive failure detection, soul integrity monitoring, and cross-domain correlation.',
  author: 'ClawLI.AI',
  license: 'Apache-2.0',
  homepage: 'https://cipherclaw.com',
  repository: 'https://github.com/Alexi5000/CipherClaw',
  category: 'debugging',
  tags: ['debugging', 'observability', 'tracing', 'ai-agents', 'openclaw', 'causal-analysis', 'predictive', 'cognitive-fingerprinting'],
  compatibility: { openclaw: '>=1.0.0', node: '>=18.0.0' },
  agents: CIPHERCLAW_AGENTS,
  skills: CIPHERCLAW_SKILLS,
  tools: CIPHERCLAW_TOOLS,
  events: CIPHERCLAW_EVENTS,
  configuration: [
    { key: 'maxTraces', type: 'number', default: 10000, description: 'Maximum traces per session', required: false },
    { key: 'anomalyThresholdStdDev', type: 'number', default: 2.5, description: 'Standard deviations for anomaly detection', required: false },
    { key: 'cascadeWindowMs', type: 'number', default: 30000, description: 'Time window for cascade detection (ms)', required: false },
    { key: 'soulDriftThreshold', type: 'number', default: 15, description: 'Threshold for soul drift alerts', required: false },
    { key: 'enableSelfDebug', type: 'boolean', default: true, description: 'Enable self-debugging loop', required: false },
    { key: 'enableHierarchyPropagation', type: 'boolean', default: true, description: 'Enable hierarchy debug propagation', required: false },
    { key: 'persistToSupabase', type: 'boolean', default: true, description: 'Persist debug data to Supabase', required: false },
  ],
};
