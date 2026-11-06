/**
 * CipherClaw — Basic Usage Example
 *
 * This example shows how to:
 * 1. Create a CipherClaw instance
 * 2. Start a debug session
 * 3. Ingest traces from your agent system
 * 4. Analyze errors, behavior, and health
 * 5. Generate a full debug report
 *
 * Run with: npx tsx examples/basic-usage.ts
 */

import { createCipherClaw } from '../src/index';
import type { Trace } from '../src/types/index';

// ─── 1. Create a CipherClaw instance ────────────────────────────────────────

const cc = createCipherClaw({
  maxTraces: 10000,
  anomalyThresholdStdDev: 2.5,
  cascadeWindowMs: 30000,
  enableSelfDebug: true,
  enableHierarchyPropagation: true,
});

// ─── 2. Subscribe to events ─────────────────────────────────────────────────

cc.on('error-classified', (event) => {
  console.log(`[EVENT] Error classified: ${event.payload.module} / ${event.payload.severity}`);
});

cc.on('anomaly-detected', (event) => {
  console.log(`[EVENT] Anomaly detected: ${event.payload.type}`);
});

cc.on('prediction-generated', (event) => {
  console.log(`[EVENT] Prediction: ${String(event.payload.predictedFailureType)} (${(Number(event.payload.confidence) * 100).toFixed(0)}%)`);
});

// ─── 3. Start a debug session ───────────────────────────────────────────────

const session = cc.startSession({ domain: 'agent' });
console.log(`\nSession started: ${session.id}\n`);

// ─── 4. Simulate agent traces ───────────────────────────────────────────────

const now = Date.now();

// A successful planning trace
const planTrace: Trace = {
  id: 'trace-plan-001',
  sessionId: session.id,
  agentId: 'orchestrator-rose',
  domain: 'agent',
  rootSpanId: 'span-plan-1',
  startTime: now - 10000,
  endTime: now - 8000,
  durationMs: 2000,
  status: 'ok',
  totalTokens: 0,
  totalCost: 0,
  spans: [
    {
      id: 'span-plan-1',
      traceId: 'trace-plan-001',
      parentSpanId: null,
      name: 'rose.receive_task',
      category: 'planning',
      startTime: now - 10000,
      endTime: now - 9500,
      durationMs: 500,
      status: 'ok',
      agentId: 'orchestrator-rose',
      domain: 'agent',
      attributes: { task: 'Generate weekly report' },
      events: [],
    },
    {
      id: 'span-plan-2',
      traceId: 'trace-plan-001',
      parentSpanId: 'span-plan-1',
      name: 'rose.create_plan',
      category: 'planning',
      startTime: now - 9500,
      endTime: now - 8500,
      durationMs: 1000,
      status: 'ok',
      agentId: 'orchestrator-rose',
      domain: 'agent',
      attributes: { steps: 4 },
      events: [],
    },
    {
      id: 'span-plan-3',
      traceId: 'trace-plan-001',
      parentSpanId: 'span-plan-1',
      name: 'rose.delegate_to_worker',
      category: 'action',
      startTime: now - 8500,
      endTime: now - 8000,
      durationMs: 500,
      status: 'ok',
      agentId: 'orchestrator-rose',
      domain: 'agent',
      attributes: { delegateTo: 'content-writer' },
      events: [],
    },
  ],
};

// A failing tool call trace
const errorTrace: Trace = {
  id: 'trace-error-001',
  sessionId: session.id,
  agentId: 'content-writer',
  domain: 'content',
  rootSpanId: 'span-err-1',
  startTime: now - 7000,
  endTime: now - 4000,
  durationMs: 3000,
  status: 'error',
  totalTokens: 0,
  totalCost: 0,
  spans: [
    {
      id: 'span-err-1',
      traceId: 'trace-error-001',
      parentSpanId: null,
      name: 'writer.fetch_data',
      category: 'action',
      startTime: now - 7000,
      endTime: now - 5000,
      durationMs: 2000,
      status: 'ok',
      agentId: 'content-writer',
      domain: 'content',
      attributes: {},
      events: [],
    },
    {
      id: 'span-err-2',
      traceId: 'trace-error-001',
      parentSpanId: 'span-err-1',
      name: 'writer.call_llm',
      category: 'action',
      startTime: now - 5000,
      endTime: now - 4000,
      durationMs: 1000,
      status: 'error',
      agentId: 'content-writer',
      domain: 'content',
      attributes: { error: 'Rate limit exceeded' },
      events: [
        { name: 'error', timestamp: now - 4000, attributes: { message: 'Rate limit exceeded on OpenAI API' } },
      ],
    },
  ],
};

// Ingest both traces
cc.ingestTrace(planTrace);
cc.ingestTrace(errorTrace);

console.log('Traces ingested.\n');

// ─── 5. Analyze ─────────────────────────────────────────────────────────────

// Classify the error
const classified = cc.classifyError('Rate limit exceeded on OpenAI API');
console.log('Error Classification:');
console.log(`  Module: ${classified.module}`);
console.log(`  Severity: ${classified.severity}`);
console.log(`  Recoverability: ${classified.recoverability}`);
console.log(`  Suggested Fix: ${classified.suggestedFix}\n`);

// Get the causal graph
const graph = cc.getCausalGraph();
if (graph) {
  console.log('Causal Debug Graph:');
  console.log(`  Nodes: ${graph.nodes.length}`);
  console.log(`  Edges: ${graph.edges.length}`);
  console.log(`  Root Causes: ${graph.rootCauses.length}`);
  // graph.rootCauses holds node ids; resolve them to nodes via getRootCauses().
  cc.getRootCauses().forEach((rc) => {
    console.log(`    → ${rc.operation} (probability: ${(rc.rootCauseProbability * 100).toFixed(0)}%)`);
  });
  console.log();
}

// Cognitive fingerprint
const fp = cc.computeCognitiveFingerprint('orchestrator-rose');
if (fp) {
  console.log('Cognitive Fingerprint (orchestrator-rose):');
  console.log(`  Drift Score: ${fp.driftScore.toFixed(1)}`);
  console.log(`  Drift Direction: ${fp.driftDirection}\n`);
}

// Predictions
const predictions = cc.getPredictions();
console.log(`Predictions: ${predictions.length}`);
predictions.forEach((p) => {
  console.log(`  → ${p.predictedFailureType} (${(p.confidence * 100).toFixed(0)}% confidence)`);
});
console.log();

// ─── 6. Generate Report ─────────────────────────────────────────────────────

const report = cc.generateReport();
if (report) {
  console.log('Veronica Debug Report:');
  console.log(`  Health Score: ${report.healthScore}/100`);
  console.log(`  Top Issues: ${report.topIssues.length}`);
  console.log(`  Recommendations: ${report.recommendations.length}`);
  report.recommendations.forEach((r) => {
    console.log(`    → ${r}`);
  });
  console.log();
}

// ─── 7. Self-Debug ──────────────────────────────────────────────────────────

const selfCheck = cc.selfDebug();
console.log('Self-Debug:');
console.log(`  Healthy: ${selfCheck.healthy}`);
console.log(`  Issues: ${selfCheck.issues.length}`);
console.log(`  Actions Taken: ${selfCheck.actions.length}\n`);

// ─── 8. Complete Session ────────────────────────────────────────────────────

const completed = cc.completeSession();
if (completed) {
  console.log(`Session completed: ${completed.status}`);
  console.log(`Duration: ${(completed.endedAt ?? Date.now()) - completed.startedAt}ms`);
}
