/**
 * CipherClaw — End-to-End Tests
 * Full debug session lifecycle across all domains.
 * These tests simulate real-world usage scenarios from start to finish.
 */

import { describe, it, expect } from 'vitest';
import { CipherClawEngine, uid } from '../core/engine.js';
import { CipherClawAdapter, createCipherClaw } from '../openclaw/adapter.js';
import type { Span, Trace, MemoryTier } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function makeSpan(overrides: Partial<Span> = {}): Span {
  return {
    id: uid('sp'),
    traceId: 'trace-1',
    parentSpanId: null,
    name: 'test-span',
    category: 'tool_call',
    agentId: 'agent-alpha',
    domain: 'agent',
    startTime: Date.now() - 100,
    endTime: Date.now(),
    durationMs: 100,
    status: 'ok',
    attributes: {},
    events: [],
    tokenUsage: { prompt: 100, completion: 50, total: 150 },
    cost: 0.001,
    ...overrides,
  };
}

function makeTrace(spans: Span[], overrides: Partial<Trace> = {}): Trace {
  const start = Math.min(...spans.map(s => s.startTime));
  const end = Math.max(...spans.map(s => s.endTime));
  return {
    id: uid('tr'),
    sessionId: '',
    rootSpanId: spans[0]?.id ?? '',
    spans,
    startTime: start,
    endTime: end,
    durationMs: end - start,
    agentId: spans[0]?.agentId ?? null,
    domain: spans[0]?.domain ?? 'agent',
    status: spans.some(s => s.status === 'critical') ? 'critical'
      : spans.some(s => s.status === 'error') ? 'error'
      : spans.some(s => s.status === 'warning') ? 'warning' : 'ok',
    totalTokens: spans.reduce((s, sp) => s + (sp.tokenUsage?.total ?? 0), 0),
    totalCost: spans.reduce((s, sp) => s + (sp.cost ?? 0), 0),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// E2E TEST 1: FULL AGENT DEBUG SESSION
// ═══════════════════════════════════════════════════════════════

describe('E2E: Full Agent Debug Session', () => {
  it('completes a full agent debugging lifecycle', () => {
    const adapter = createCipherClaw();

    // Step 1: Start session targeting an agent
    const session = adapter.startSession({ domain: 'agent', targetAgentId: 'agent-alpha' });
    expect(session.status).toBe('hunting');
    expect(session.domain).toBe('agent');

    // Step 2: Add breakpoints
    const bp1 = adapter.addBreakpoint('on_error');
    const bp2 = adapter.addBreakpoint('on_tool_call');
    expect(bp1.type).toBe('on_error');
    expect(bp2.type).toBe('on_tool_call');

    // Step 3: Ingest traces with a mix of success and failure
    const planSpan = makeSpan({ id: 'sp-plan', name: 'plan', category: 'planning', parentSpanId: null });
    const toolSpan = makeSpan({ id: 'sp-tool', name: 'search', category: 'tool_call', parentSpanId: 'sp-plan' });
    const errorSpan = makeSpan({ id: 'sp-err', name: 'execute', category: 'reasoning', parentSpanId: 'sp-plan', status: 'error' });
    const trace = makeTrace([planSpan, toolSpan, errorSpan]);
    adapter.ingestTrace(trace);

    // Step 4: Classify the error
    const classified = adapter.classifyError('Tool execution failed: timeout');
    expect(classified.module).toBeDefined();
    expect(classified.severity).toBeDefined();

    // Step 5: Check causal graph
    const graph = adapter.getCausalGraph();
    expect(graph).toBeDefined();
    expect(graph!.nodes.length).toBe(3);

    // Step 6: Compute cognitive fingerprint
    const fp = adapter.computeCognitiveFingerprint('agent-alpha');
    expect(fp.agentId).toBe('agent-alpha');

    // Step 7: Analyze soul integrity
    const soul = adapter.analyzeSoulIntegrity('agent-alpha', {
      personality: ['analytical', 'precise'],
      values: ['accuracy'],
      style: 'technical',
    }, {
      responses: ['Analytical result computed'],
      decisions: ['Chose precise method'],
      tone: 'technical',
    });
    expect(soul.overallScore).toBeGreaterThan(0);

    // Step 8: Run flow tests
    const flowResults = adapter.runFlowTests('agent');
    expect(flowResults.total).toBeGreaterThan(0);

    // Step 9: Capture snapshot
    const snapshot = adapter.captureSnapshot();
    expect(snapshot).not.toBeNull();

    // Step 10: Generate Veronica report
    const report = adapter.generateReport();
    expect(report.healthScore).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);

    // Step 11: Complete session
    const completed = adapter.completeSession();
    expect(completed).toBeDefined();
    expect(completed!.status).toBe('completed');
    expect(completed!.veronicaReport).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 2: CRM PIPELINE DEBUG
// ═══════════════════════════════════════════════════════════════

describe('E2E: CRM Pipeline Debug', () => {
  it('debugs a CRM lead processing pipeline end-to-end', () => {
    const adapter = createCipherClaw();
    const session = adapter.startSession({ domain: 'crm' });

    // Simulate CRM pipeline spans
    const captureSpan = makeSpan({ id: 'sp-capture', name: 'lead-capture', category: 'lifecycle', domain: 'crm', parentSpanId: null });
    const enrichSpan = makeSpan({ id: 'sp-enrich', name: 'lead-enrichment', category: 'tool_call', domain: 'crm', parentSpanId: 'sp-capture' });
    const scoreSpan = makeSpan({ id: 'sp-score', name: 'lead-scoring', category: 'reasoning', domain: 'crm', parentSpanId: 'sp-enrich', status: 'error' });
    const outreachSpan = makeSpan({ id: 'sp-outreach', name: 'outreach-sequence', category: 'action', domain: 'crm', parentSpanId: 'sp-score', status: 'error' });

    adapter.ingestTrace(makeTrace([captureSpan, enrichSpan, scoreSpan, outreachSpan]));

    // Classify CRM-specific errors
    const err1 = adapter.classifyError('Lead not found in CRM', { domain: 'crm' } as Partial<Span>);
    expect(err1.domain).toBe('crm');

    // Check root causes
    const rootCauses = adapter.getRootCauses();
    expect(rootCauses.length).toBeGreaterThan(0);

    // Run CRM flow tests
    const crmResults = adapter.runFlowTests('crm');
    expect(crmResults.total).toBeGreaterThan(0);

    // Generate report
    const report = adapter.generateReport();
    expect(report.domainBreakdown).toBeDefined();

    // Complete
    const completed = adapter.completeSession();
    expect(completed!.status).toBe('completed');
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 3: MULTI-DOMAIN CORRELATION
// ═══════════════════════════════════════════════════════════════

describe('E2E: Multi-Domain Correlation', () => {
  it('detects correlated failures across agent, CRM, and content domains', () => {
    const adapter = createCipherClaw();
    adapter.startSession({ domain: 'all' });

    // Inject errors across 3 domains
    adapter.classifyError('Agent loop timeout', { domain: 'agent', category: 'reasoning' } as Partial<Span>);
    adapter.classifyError('CRM sync failed', { domain: 'crm', category: 'tool_call' } as Partial<Span>);
    adapter.classifyError('Content publish rejected', { domain: 'content', category: 'action' } as Partial<Span>);

    // Detect cross-domain correlations
    const correlations = adapter.detectCrossDomainCorrelations();
    expect(Array.isArray(correlations)).toBe(true);

    // Self-debug to verify engine health
    const selfReport = adapter.selfDebug();
    expect(typeof selfReport.healthy).toBe('boolean');
    expect(Array.isArray(selfReport.issues)).toBe(true);

    const completed = adapter.completeSession();
    expect(completed!.errors.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 4: MEMORY HEALTH + ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════

describe('E2E: Memory Health + Anomaly Detection', () => {
  it('analyzes memory health and detects anomalies in a single session', () => {
    const adapter = createCipherClaw();
    adapter.startSession({ domain: 'agent' });

    // Analyze memory health
    const memState: Record<MemoryTier, { items: unknown[]; decayRates: number[]; retrievalHits: number; retrievalMisses: number }> = {
      working: { items: Array(5).fill({}), decayRates: [0.1, 0.1, 0.1, 0.1, 0.1], retrievalHits: 95, retrievalMisses: 5 },
      short_term: { items: Array(10).fill({}), decayRates: Array(10).fill(0.2), retrievalHits: 80, retrievalMisses: 20 },
      episodic: { items: Array(30).fill({}), decayRates: Array(30).fill(0.9), retrievalHits: 40, retrievalMisses: 60 },
      semantic: { items: Array(50).fill({}), decayRates: Array(50).fill(0.05), retrievalHits: 90, retrievalMisses: 10 },
      archival: { items: Array(100).fill({}), decayRates: Array(100).fill(0.01), retrievalHits: 20, retrievalMisses: 80 },
    };

    const memReport = adapter.analyzeMemoryHealth(memState);
    expect(memReport.overallHealth).toBeGreaterThan(0);
    expect(memReport.issues.length).toBeGreaterThan(0); // episodic stale + archival retrieval failure

    // Detect anomalies — need 20+ normal spans for z-score math to work
    const spans: { id: string; name: string; durationMs: number }[] = [];
    for (let i = 0; i < 20; i++) {
      spans.push({ id: `sp-${i}`, name: 'normal', durationMs: 100 });
    }
    spans.push({ id: 'sp-spike', name: 'spike', durationMs: 100000 });
    const anomalies = adapter.detectAnomalies(spans);
    expect(anomalies.length).toBeGreaterThan(0);

    const completed = adapter.completeSession();
    expect(completed!.memoryHealth).not.toBeNull();
    expect(completed!.anomalies.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 5: HIERARCHY PROPAGATION + FLOW SYNTHESIS
// ═══════════════════════════════════════════════════════════════

describe('E2E: Hierarchy Propagation + Flow Synthesis', () => {
  it('propagates events through hierarchy and synthesizes flow tests', () => {
    const adapter = createCipherClaw();
    adapter.startSession({ domain: 'agent' });

    // Propagate an error escalation up the hierarchy
    adapter.propagateDebugEvent({
      sourceAgentId: 'worker-1',
      sourceLevel: 3,
      targetAgentId: 'veronica',
      targetLevel: 0,
      direction: 'up',
      eventType: 'error_escalation',
      payload: { error: 'Critical tool failure' },
      propagationPath: ['worker-1', 'specialist-1', 'orchestrator-1', 'veronica'],
    });

    // Propagate intervention back down
    adapter.propagateDebugEvent({
      sourceAgentId: 'veronica',
      sourceLevel: 0,
      targetAgentId: 'worker-1',
      targetLevel: 3,
      direction: 'down',
      eventType: 'intervention',
      payload: { action: 'reset_and_retry' },
      propagationPath: ['veronica', 'orchestrator-1', 'specialist-1', 'worker-1'],
    });

    // Ingest a trace and synthesize a flow test from it
    const spans = [
      makeSpan({ id: 'sp-boot', name: 'agent-boot', category: 'lifecycle' }),
      makeSpan({ id: 'sp-plan', name: 'create-plan', category: 'planning', parentSpanId: 'sp-boot' }),
      makeSpan({ id: 'sp-exec', name: 'execute-tool', category: 'tool_call', parentSpanId: 'sp-plan' }),
      makeSpan({ id: 'sp-mem', name: 'write-memory', category: 'memory', parentSpanId: 'sp-exec' }),
    ];
    const trace = makeTrace(spans);
    adapter.ingestTrace(trace);

    const flowTest = adapter.synthesizeFlowTest(trace.id);
    expect(flowTest).not.toBeNull();
    expect(flowTest!.steps.length).toBe(4);

    const completed = adapter.completeSession();
    expect(completed!.hierarchyEvents.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 6: OPENCLAW ADAPTER EVENT BUS
// ═══════════════════════════════════════════════════════════════

describe('E2E: OpenClaw Adapter Event Bus', () => {
  it('emits events through the event bus during operations', () => {
    const adapter = createCipherClaw();
    const events: string[] = [];

    // Subscribe to all events
    adapter.onAny((event) => {
      events.push(event.type);
    });

    // Perform operations that emit events
    adapter.startSession({ domain: 'agent' });
    adapter.classifyError('Test error');

    const spans = [
      makeSpan({ id: 'sp-1', name: 'test', category: 'tool_call' }),
    ];
    adapter.ingestTrace(makeTrace(spans));

    adapter.completeSession();

    // Verify events were emitted
    expect(events).toContain('session-started');
    expect(events).toContain('error-classified');
    expect(events).toContain('trace-ingested');
    expect(events).toContain('session-completed');
  });

  it('supports targeted event subscriptions', () => {
    const adapter = createCipherClaw();
    const errorEvents: string[] = [];

    adapter.on('error-classified', (event) => {
      errorEvents.push(event.payload.errorId as string);
    });

    adapter.startSession();
    adapter.classifyError('Error 1');
    adapter.classifyError('Error 2');

    expect(errorEvents.length).toBe(2);
  });

  it('unsubscribes from events correctly', () => {
    const adapter = createCipherClaw();
    let count = 0;

    const unsub = adapter.on('session-started', () => { count++; });
    adapter.startSession();
    expect(count).toBe(1);

    unsub();
    adapter.startSession();
    expect(count).toBe(1); // Should not increment after unsubscribe
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 7: PAUSE / RESUME / REPLAY
// ═══════════════════════════════════════════════════════════════

describe('E2E: Pause, Resume, and Replay', () => {
  it('supports pause, resume, snapshot capture, and replay', () => {
    const adapter = createCipherClaw();
    const session = adapter.startSession();

    // Ingest some data
    adapter.ingestTrace(makeTrace([makeSpan()]));
    adapter.classifyError('Test error 1');

    // Capture snapshot
    const snap1 = adapter.captureSnapshot();
    expect(snap1).not.toBeNull();

    // Pause
    adapter.pauseSession();
    expect(adapter.getSession()!.status).toBe('paused');

    // Resume
    adapter.resumeSession();
    expect(adapter.getSession()!.status).toBe('hunting');

    // Add more data
    adapter.classifyError('Test error 2');
    const snap2 = adapter.captureSnapshot();

    // Replay to first snapshot
    const replayed = adapter.replayToSnapshot(snap1!.id);
    expect(replayed).not.toBeNull();
    expect(adapter.getSession()!.status).toBe('paused');

    // Complete
    adapter.resumeSession();
    const completed = adapter.completeSession();
    expect(completed!.snapshots.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E TEST 8: MANIFEST AND CONFIG
// ═══════════════════════════════════════════════════════════════

describe('E2E: Manifest and Configuration', () => {
  it('returns a valid OpenClaw manifest', () => {
    const adapter = createCipherClaw();
    const manifest = adapter.getManifest();

    expect(manifest.name).toBe('cipherclaw');
    expect(manifest.agents.length).toBe(5);
    expect(manifest.skills.length).toBe(10);
    expect(manifest.tools.length).toBe(14);
    expect(manifest.events.length).toBe(12);
  });

  it('supports runtime config updates', () => {
    const adapter = createCipherClaw({ maxTraces: 100 });
    expect(adapter.getConfig().maxTraces).toBe(100);

    adapter.updateConfig({ maxTraces: 200 });
    expect(adapter.getConfig().maxTraces).toBe(200);
  });

  it('returns accurate statistics', () => {
    const adapter = createCipherClaw();
    adapter.startSession();
    adapter.startSession();

    const stats = adapter.getStats();
    expect(stats.totalSessions).toBe(2);
    expect(stats.activeSessions).toBe(2);
  });

  it('provides raw engine access', () => {
    const adapter = createCipherClaw();
    const engine = adapter.getEngine();
    expect(engine).toBeInstanceOf(CipherClawEngine);
  });
});
