import { describe, expect, it } from 'vitest';
import { CipherClawEngine } from '../core/engine.js';
import { evaluateCondition } from '../core/condition.js';
import type { Span } from '../types/index.js';

const span: Span = {
  id: 'condition-span', traceId: 'condition-trace', parentSpanId: null,
  name: 'condition test', category: 'tool_call', agentId: 'agent-1', domain: 'agent',
  startTime: 0, endTime: 1500, durationMs: 1500, status: 'error',
  attributes: { retries: 3, label: 'it\'s slow', threshold: '1000' }, events: [],
  tokenUsage: { prompt: 20, completion: 10, total: 30 }, cost: 0.2,
};

function ingest(condition: string): number {
  const engine = new CipherClawEngine();
  const session = engine.startSession();
  const breakpoint = engine.addBreakpoint(session.id, 'conditional', condition);
  engine.ingestSpan(session.id, { ...span });
  expect(session.snapshots.length).toBe(breakpoint.hitCount);
  return breakpoint.hitCount;
}

describe('bounded breakpoint conditions', () => {
  it.each([
    'span.status === "error" && span.durationMs >= 1000',
    '(span.status === "critical" || span.status === "error") && !false',
    'span.tokenUsage.total > 20 && span.attributes["retries"] === 3',
    'session.breakpoints[0].type === "conditional"',
    'span.cost < 1e0 && span.cost > -1',
    'span.attributes.label === "it\'s slow"',
    "span.attributes.label === 'it\\'s slow'",
    'span.attributes.threshold == 1000',
    '(span.attributes.missing ?? 9) === 9',
    'span.attributes.missing === undefined',
    'false || true && true',
    'true || span.missing.child',
  ])('captures an engine snapshot for %s', condition => {
    expect(ingest(condition)).toBe(1);
  });

  it.each([
    'span.status === "ok"',
    'false && span.missing.child',
    'span.attributes.threshold === 1000',
    'span.missing.child === undefined',
    'span.durationMs = 0',
    'span.status ===',
    'true trailing',
    'span["constructor"]',
    'span.__proto__',
    'session.breakpoints.constructor.constructor("return process")()',
    'globalThis.process',
    'process.exit()',
    'span.events.push(1)',
    'true || process.exit()',
    'span[span.name]',
    'new Date()',
    '`template`',
    '1e999',
    'true; while(true) {}',
  ])('does not hit for unsupported, malicious, or false input %s', condition => {
    expect(ingest(condition)).toBe(0);
  });

  it('rejects executable input before it can mutate process state', () => {
    const global = globalThis as typeof globalThis & { conditionExecuted?: boolean };
    delete global.conditionExecuted;
    expect(ingest('(globalThis.conditionExecuted = true)')).toBe(0);
    expect(global.conditionExecuted).toBeUndefined();
    expect(ingest('(span.attributes.retries = 999)')).toBe(0);
    expect(span.attributes.retries).toBe(3);
  });

  it('does not invoke getters, inherited properties, or object coercion', () => {
    let calls = 0;
    const data = Object.create({ inherited: 'unsafe' });
    Object.defineProperty(data, 'secret', { get() { calls++; return true; } });
    data.coercion = { valueOf() { calls++; return 2; }, toString() { calls++; return '2'; } };
    expect(evaluateCondition('span.secret', data, {})).toBe(false);
    expect(evaluateCondition('span.inherited === "unsafe"', data, {})).toBe(false);
    expect(evaluateCondition('span.coercion > 1', data, {})).toBe(false);
    expect(evaluateCondition('span.coercion == 2', data, {})).toBe(false);
    expect(calls).toBe(0);
  });

  it('bounds input size, nesting, tokens, and property traversal', () => {
    expect(ingest(' '.repeat(4097) + 'true')).toBe(0);
    expect(ingest('('.repeat(40) + 'true' + ')'.repeat(40))).toBe(0);
    expect(ingest('!'.repeat(40) + 'false')).toBe(0);
    expect(ingest(Array(150).fill('true').join(' || '))).toBe(0);
    expect(ingest('span' + '.a'.repeat(33))).toBe(0);
  });

  it('preserves enabled and maximum-hit controls', () => {
    const engine = new CipherClawEngine();
    const session = engine.startSession();
    const breakpoint = engine.addBreakpoint(session.id, 'conditional', 'true');
    breakpoint.enabled = false;
    engine.ingestSpan(session.id, { ...span });
    expect(breakpoint.hitCount).toBe(0);
    breakpoint.enabled = true;
    breakpoint.maxHits = 1;
    engine.ingestSpan(session.id, { ...span });
    engine.ingestSpan(session.id, { ...span });
    expect(breakpoint.hitCount).toBe(1);
  });
});
