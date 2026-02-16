/**
 * CipherClaw — Smoke Tests
 * Quick validation that every public API method works without crashing.
 * These tests verify the contract — every exported function and class method
 * can be called with valid inputs and returns the expected type.
 */

import { describe, it, expect } from 'vitest';
import {
  CipherClawEngine,
  ERROR_PATTERNS,
  PREDICTION_PATTERNS,
  createBuiltInFlowTests,
  uid,
  mean,
  stddev,
  clamp,
  entropy,
} from '../core/engine.js';
import { CipherClawAdapter, createCipherClaw } from '../openclaw/adapter.js';
import { CIPHERCLAW_MANIFEST } from '../openclaw/manifest.js';
import { DEFAULT_CONFIG } from '../types/index.js';
import type { Span, Trace, MemoryTier } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function makeSpan(overrides: Partial<Span> = {}): Span {
  return {
    id: uid('sp'), traceId: 'tr-1', parentSpanId: null, name: 'test',
    category: 'tool_call', agentId: 'agent-1', domain: 'agent',
    startTime: Date.now() - 100, endTime: Date.now(), durationMs: 100,
    status: 'ok', attributes: {}, events: [],
    tokenUsage: { prompt: 50, completion: 25, total: 75 }, cost: 0.001,
    ...overrides,
  };
}

function makeTrace(spans: Span[]): Trace {
  const start = Math.min(...spans.map(s => s.startTime));
  const end = Math.max(...spans.map(s => s.endTime));
  return {
    id: uid('tr'), sessionId: '', rootSpanId: spans[0]?.id ?? '', spans,
    startTime: start, endTime: end, durationMs: end - start,
    agentId: spans[0]?.agentId ?? null, domain: spans[0]?.domain ?? 'agent',
    status: 'ok', totalTokens: 75, totalCost: 0.001,
  };
}

// ═══════════════════════════════════════════════════════════════
// SMOKE: EXPORTED CONSTANTS
// ═══════════════════════════════════════════════════════════════

describe('Smoke: Exported Constants', () => {
  it('ERROR_PATTERNS is a non-empty array', () => {
    expect(Array.isArray(ERROR_PATTERNS)).toBe(true);
    expect(ERROR_PATTERNS.length).toBeGreaterThan(0);
  });

  it('PREDICTION_PATTERNS is a non-empty array', () => {
    expect(Array.isArray(PREDICTION_PATTERNS)).toBe(true);
    expect(PREDICTION_PATTERNS.length).toBeGreaterThan(0);
  });

  it('DEFAULT_CONFIG has all required fields', () => {
    expect(DEFAULT_CONFIG.maxTraces).toBeDefined();
    expect(DEFAULT_CONFIG.anomalyThresholdStdDev).toBeDefined();
    expect(DEFAULT_CONFIG.enableSelfDebug).toBeDefined();
    expect(DEFAULT_CONFIG.enableHierarchyPropagation).toBeDefined();
    expect(DEFAULT_CONFIG.persistToSupabase).toBeDefined();
  });

  it('CIPHERCLAW_MANIFEST has valid structure', () => {
    expect(CIPHERCLAW_MANIFEST.name).toBe('cipherclaw');
    expect(CIPHERCLAW_MANIFEST.version).toBeDefined();
    expect(Array.isArray(CIPHERCLAW_MANIFEST.agents)).toBe(true);
    expect(Array.isArray(CIPHERCLAW_MANIFEST.skills)).toBe(true);
    expect(Array.isArray(CIPHERCLAW_MANIFEST.tools)).toBe(true);
    expect(Array.isArray(CIPHERCLAW_MANIFEST.events)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// SMOKE: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

describe('Smoke: Utility Functions', () => {
  it('uid() returns a string', () => expect(typeof uid('x')).toBe('string'));
  it('mean() returns a number', () => expect(typeof mean([1, 2])).toBe('number'));
  it('stddev() returns a number', () => expect(typeof stddev([1, 2])).toBe('number'));
  it('clamp() returns a number', () => expect(typeof clamp(5, 0, 10)).toBe('number'));
  it('entropy() returns a number', () => expect(typeof entropy([1, 2])).toBe('number'));
  it('createBuiltInFlowTests() returns an array', () => expect(Array.isArray(createBuiltInFlowTests())).toBe(true));
});

// ═══════════════════════════════════════════════════════════════
// SMOKE: ENGINE CLASS METHODS
// ═══════════════════════════════════════════════════════════════

describe('Smoke: CipherClawEngine Methods', () => {
  it('constructor() does not throw', () => {
    expect(() => new CipherClawEngine()).not.toThrow();
  });

  it('constructor(config) does not throw', () => {
    expect(() => new CipherClawEngine({ maxTraces: 100 })).not.toThrow();
  });

  it('startSession() returns a session', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(s.id).toBeDefined();
    expect(s.status).toBe('hunting');
  });

  it('getSession() returns session or undefined', () => {
    const e = new CipherClawEngine();
    expect(e.getSession('nonexistent')).toBeUndefined();
    const s = e.startSession();
    expect(e.getSession(s.id)).toBeDefined();
  });

  it('getAllSessions() returns array', () => {
    const e = new CipherClawEngine();
    expect(Array.isArray(e.getAllSessions())).toBe(true);
  });

  it('pauseSession() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(() => e.pauseSession(s.id)).not.toThrow();
  });

  it('resumeSession() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    e.pauseSession(s.id);
    expect(() => e.resumeSession(s.id)).not.toThrow();
  });

  it('completeSession() returns session', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const c = e.completeSession(s.id);
    expect(c).toBeDefined();
    expect(c!.status).toBe('completed');
  });

  it('ingestTrace() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(() => e.ingestTrace(s.id, makeTrace([makeSpan()]))).not.toThrow();
  });

  it('ingestSpan() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(() => e.ingestSpan(s.id, makeSpan())).not.toThrow();
  });

  it('classifyError() returns classified error', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const err = e.classifyError(s.id, 'Test error');
    expect(err.id).toBeDefined();
    expect(err.module).toBeDefined();
    expect(err.severity).toBeDefined();
  });

  it('getCausalGraph() returns graph or undefined', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const g = e.getCausalGraph(s.id);
    expect(g).toBeDefined();
  });

  it('getRootCauses() returns array', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(Array.isArray(e.getRootCauses(s.id))).toBe(true);
  });

  it('computeCognitiveFingerprint() returns fingerprint', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    e.ingestTrace(s.id, makeTrace([makeSpan()]));
    const fp = e.computeCognitiveFingerprint(s.id, 'agent-1');
    expect(fp.agentId).toBe('agent-1');
  });

  it('analyzeSoulIntegrity() returns report', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const r = e.analyzeSoulIntegrity(s.id, 'agent-1',
      { personality: ['helpful'], values: ['accuracy'], style: 'formal' },
      { responses: ['I am helpful'], decisions: ['Chose accuracy'], tone: 'formal' },
    );
    expect(r.agentId).toBe('agent-1');
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('analyzeMemoryHealth() returns report', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const mem: Record<MemoryTier, { items: unknown[]; decayRates: number[]; retrievalHits: number; retrievalMisses: number }> = {
      working: { items: [{}], decayRates: [0.1], retrievalHits: 90, retrievalMisses: 10 },
      short_term: { items: [{}], decayRates: [0.2], retrievalHits: 80, retrievalMisses: 20 },
      episodic: { items: [{}], decayRates: [0.3], retrievalHits: 70, retrievalMisses: 30 },
      semantic: { items: [{}], decayRates: [0.05], retrievalHits: 95, retrievalMisses: 5 },
      archival: { items: [{}], decayRates: [0.01], retrievalHits: 60, retrievalMisses: 40 },
    };
    const r = e.analyzeMemoryHealth(s.id, mem);
    expect(r.overallHealth).toBeGreaterThanOrEqual(0);
  });

  it('detectAnomalies() returns array', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const a = e.detectAnomalies(s.id, [{ id: '1', name: 'a', durationMs: 100 }]);
    expect(Array.isArray(a)).toBe(true);
  });

  it('getPredictions() returns array', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(Array.isArray(e.getPredictions(s.id))).toBe(true);
  });

  it('detectCrossDomainCorrelations() returns array', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(Array.isArray(e.detectCrossDomainCorrelations(s.id))).toBe(true);
  });

  it('addBreakpoint() returns breakpoint', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const bp = e.addBreakpoint(s.id, 'on_error');
    expect(bp.type).toBe('on_error');
  });

  it('removeBreakpoint() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const bp = e.addBreakpoint(s.id, 'on_error');
    expect(() => e.removeBreakpoint(s.id, bp.id)).not.toThrow();
  });

  it('toggleBreakpoint() does not throw', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const bp = e.addBreakpoint(s.id, 'on_error');
    expect(() => e.toggleBreakpoint(s.id, bp.id)).not.toThrow();
  });

  it('captureManualSnapshot() returns snapshot', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const snap = e.captureManualSnapshot(s.id);
    expect(snap).not.toBeNull();
  });

  it('getSnapshots() returns array', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(Array.isArray(e.getSnapshots(s.id))).toBe(true);
  });

  it('replayToSnapshot() returns snapshot or null', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const snap = e.captureManualSnapshot(s.id)!;
    const r = e.replayToSnapshot(s.id, snap.id);
    expect(r).not.toBeNull();
  });

  it('propagateDebugEvent() returns event', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const ev = e.propagateDebugEvent(s.id, {
      sourceAgentId: 'a', sourceLevel: 0, targetAgentId: 'b', targetLevel: 1,
      direction: 'down', eventType: 'debug_request', payload: {},
      propagationPath: ['a', 'b'],
    });
    expect(ev).toBeDefined();
  });

  it('runFlowTests() returns results', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const r = e.runFlowTests(s.id);
    expect(r.total).toBeGreaterThan(0);
  });

  it('synthesizeFlowTest() returns null for nonexistent trace', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    expect(e.synthesizeFlowTest(s.id, 'nonexistent')).toBeNull();
  });

  it('generateVeronicaReport() returns report', () => {
    const e = new CipherClawEngine();
    const s = e.startSession();
    const r = e.generateVeronicaReport(s.id);
    expect(r.sessionId).toBe(s.id);
    expect(r.healthScore).toBeDefined();
  });

  it('selfDebug() returns report', () => {
    const e = new CipherClawEngine();
    const r = e.selfDebug();
    expect(typeof r.healthy).toBe('boolean');
    expect(Array.isArray(r.issues)).toBe(true);
    expect(Array.isArray(r.actions)).toBe(true);
  });

  it('getSelfDebugLog() returns array', () => {
    const e = new CipherClawEngine();
    expect(Array.isArray(e.getSelfDebugLog())).toBe(true);
  });

  it('getConfig() returns config', () => {
    const e = new CipherClawEngine();
    const c = e.getConfig();
    expect(c.maxTraces).toBeDefined();
  });

  it('updateConfig() does not throw', () => {
    const e = new CipherClawEngine();
    expect(() => e.updateConfig({ maxTraces: 50 })).not.toThrow();
  });

  it('getStats() returns stats', () => {
    const e = new CipherClawEngine();
    const s = e.getStats();
    expect(typeof s.totalSessions).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════
// SMOKE: ADAPTER CLASS METHODS
// ═══════════════════════════════════════════════════════════════

describe('Smoke: CipherClawAdapter Methods', () => {
  it('createCipherClaw() factory returns adapter', () => {
    const a = createCipherClaw();
    expect(a).toBeInstanceOf(CipherClawAdapter);
  });

  it('getManifest() returns manifest', () => {
    const a = createCipherClaw();
    expect(a.getManifest().name).toBe('cipherclaw');
  });

  it('startSession() returns session', () => {
    const a = createCipherClaw();
    const s = a.startSession();
    expect(s.id).toBeDefined();
  });

  it('completeSession() returns session', () => {
    const a = createCipherClaw();
    a.startSession();
    const c = a.completeSession();
    expect(c).toBeDefined();
  });

  it('getSession() returns session', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(a.getSession()).toBeDefined();
  });

  it('getAllSessions() returns array', () => {
    const a = createCipherClaw();
    expect(Array.isArray(a.getAllSessions())).toBe(true);
  });

  it('pauseSession() does not throw', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(() => a.pauseSession()).not.toThrow();
  });

  it('resumeSession() does not throw', () => {
    const a = createCipherClaw();
    a.startSession();
    a.pauseSession();
    expect(() => a.resumeSession()).not.toThrow();
  });

  it('ingestTrace() does not throw', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(() => a.ingestTrace(makeTrace([makeSpan()]))).not.toThrow();
  });

  it('ingestSpan() does not throw', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(() => a.ingestSpan(makeSpan())).not.toThrow();
  });

  it('classifyError() returns error', () => {
    const a = createCipherClaw();
    a.startSession();
    const e = a.classifyError('test');
    expect(e.id).toBeDefined();
  });

  it('getCausalGraph() returns graph', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(a.getCausalGraph()).toBeDefined();
  });

  it('getRootCauses() returns array', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(Array.isArray(a.getRootCauses())).toBe(true);
  });

  it('computeCognitiveFingerprint() returns fingerprint', () => {
    const a = createCipherClaw();
    a.startSession();
    a.ingestTrace(makeTrace([makeSpan()]));
    const fp = a.computeCognitiveFingerprint('agent-1');
    expect(fp.agentId).toBe('agent-1');
  });

  it('analyzeSoulIntegrity() returns report', () => {
    const a = createCipherClaw();
    a.startSession();
    const r = a.analyzeSoulIntegrity('agent-1',
      { personality: ['helpful'], values: ['accuracy'], style: 'formal' },
      { responses: ['test'], decisions: ['test'], tone: 'formal' },
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('detectAnomalies() returns array', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(Array.isArray(a.detectAnomalies([{ id: '1', name: 'a', durationMs: 100 }]))).toBe(true);
  });

  it('getPredictions() returns array', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(Array.isArray(a.getPredictions())).toBe(true);
  });

  it('detectCrossDomainCorrelations() returns array', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(Array.isArray(a.detectCrossDomainCorrelations())).toBe(true);
  });

  it('addBreakpoint() returns breakpoint', () => {
    const a = createCipherClaw();
    a.startSession();
    const bp = a.addBreakpoint('on_error');
    expect(bp.type).toBe('on_error');
  });

  it('captureSnapshot() returns snapshot', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(a.captureSnapshot()).not.toBeNull();
  });

  it('getSnapshots() returns array', () => {
    const a = createCipherClaw();
    a.startSession();
    expect(Array.isArray(a.getSnapshots())).toBe(true);
  });

  it('runFlowTests() returns results', () => {
    const a = createCipherClaw();
    a.startSession();
    const r = a.runFlowTests();
    expect(r.total).toBeGreaterThan(0);
  });

  it('generateReport() returns report', () => {
    const a = createCipherClaw();
    a.startSession();
    const r = a.generateReport();
    expect(r.healthScore).toBeDefined();
  });

  it('selfDebug() returns report', () => {
    const a = createCipherClaw();
    const r = a.selfDebug();
    expect(typeof r.healthy).toBe('boolean');
    expect(Array.isArray(r.issues)).toBe(true);
  });

  it('getSelfDebugLog() returns array', () => {
    const a = createCipherClaw();
    expect(Array.isArray(a.getSelfDebugLog())).toBe(true);
  });

  it('getConfig() returns config', () => {
    const a = createCipherClaw();
    expect(a.getConfig().maxTraces).toBeDefined();
  });

  it('updateConfig() does not throw', () => {
    const a = createCipherClaw();
    expect(() => a.updateConfig({ maxTraces: 50 })).not.toThrow();
  });

  it('getStats() returns stats', () => {
    const a = createCipherClaw();
    expect(a.getStats().totalSessions).toBeDefined();
  });

  it('getEngine() returns engine instance', () => {
    const a = createCipherClaw();
    expect(a.getEngine()).toBeInstanceOf(CipherClawEngine);
  });

  it('on() returns unsubscribe function', () => {
    const a = createCipherClaw();
    const unsub = a.on('test', () => {});
    expect(typeof unsub).toBe('function');
  });

  it('onAny() returns unsubscribe function', () => {
    const a = createCipherClaw();
    const unsub = a.onAny(() => {});
    expect(typeof unsub).toBe('function');
  });
});
