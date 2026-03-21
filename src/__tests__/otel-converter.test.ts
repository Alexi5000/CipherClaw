/**
 * CipherClaw — OTLP Converter Tests
 * Validates conversion from OpenTelemetry span format to CipherClaw types.
 */

import { describe, it, expect } from 'vitest';
import {
  convertOtlpSpan,
  convertOtlpTrace,
  OtlpStatusCode,
} from '../core/otel-converter.js';
import type { OtlpSpan, OtlpAttribute } from '../core/otel-converter.js';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function makeOtlpSpan(overrides: Partial<OtlpSpan> = {}): OtlpSpan {
  return {
    traceId: 'trace-abc',
    spanId: 'span-001',
    name: 'agent.plan',
    kind: 1,
    startTimeUnixNano: 1_700_000_000_000_000_000,
    endTimeUnixNano:   1_700_000_000_200_000_000,
    attributes: [],
    events: [],
    status: { code: OtlpStatusCode.OK },
    ...overrides,
  };
}

function attr(key: string, value: string | number | boolean): OtlpAttribute {
  if (typeof value === 'string') return { key, value: { stringValue: value } };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { key, value: { intValue: value } }
      : { key, value: { doubleValue: value } };
  }
  return { key, value: { boolValue: value } };
}

// ═══════════════════════════════════════════════════════════════
// SINGLE SPAN CONVERSION
// ═══════════════════════════════════════════════════════════════

describe('convertOtlpSpan', () => {
  it('converts basic span fields', () => {
    const span = convertOtlpSpan(makeOtlpSpan());
    expect(span.id).toBe('span-001');
    expect(span.traceId).toBe('trace-abc');
    expect(span.name).toBe('agent.plan');
    expect(span.durationMs).toBe(200);
    expect(span.status).toBe('ok');
    expect(span.parentSpanId).toBeNull();
  });

  it('maps parentSpanId correctly', () => {
    const span = convertOtlpSpan(makeOtlpSpan({ parentSpanId: 'parent-span' }));
    expect(span.parentSpanId).toBe('parent-span');
  });

  it('maps empty parentSpanId to null', () => {
    const span = convertOtlpSpan(makeOtlpSpan({ parentSpanId: '' }));
    expect(span.parentSpanId).toBeNull();
  });

  it('maps error status', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      status: { code: OtlpStatusCode.ERROR, message: 'timeout' },
    }));
    expect(span.status).toBe('error');
  });

  it('maps unset status to ok', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      status: { code: OtlpStatusCode.UNSET },
    }));
    expect(span.status).toBe('ok');
  });

  it('extracts token usage from gen_ai attributes', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [
        attr('gen_ai.usage.prompt_tokens', 100),
        attr('gen_ai.usage.completion_tokens', 50),
      ],
    }));
    expect(span.tokenUsage).toEqual({ prompt: 100, completion: 50, total: 150 });
  });

  it('extracts token usage from llm attributes (fallback)', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [
        attr('llm.token_count.prompt', 80),
        attr('llm.token_count.completion', 40),
      ],
    }));
    expect(span.tokenUsage).toEqual({ prompt: 80, completion: 40, total: 120 });
  });

  it('sets tokenUsage undefined when no token attributes', () => {
    const span = convertOtlpSpan(makeOtlpSpan());
    expect(span.tokenUsage).toBeUndefined();
  });

  it('extracts cost from gen_ai.usage.cost', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [attr('gen_ai.usage.cost', 0.0025)],
    }));
    expect(span.cost).toBe(0.0025);
  });

  it('sets cost undefined when no cost attribute', () => {
    const span = convertOtlpSpan(makeOtlpSpan());
    expect(span.cost).toBeUndefined();
  });

  it('extracts agentId from agent.id attribute', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [attr('agent.id', 'my-agent')],
    }));
    expect(span.agentId).toBe('my-agent');
  });

  it('extracts agentId from cipherclaw.agent_id attribute', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [attr('cipherclaw.agent_id', 'cc-agent')],
    }));
    expect(span.agentId).toBe('cc-agent');
  });

  it('sets agentId to null when not present', () => {
    const span = convertOtlpSpan(makeOtlpSpan());
    expect(span.agentId).toBeNull();
  });

  it('infers domain from cipherclaw.domain attribute', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [attr('cipherclaw.domain', 'memory')],
    }));
    expect(span.domain).toBe('memory');
  });

  it('infers domain from component attribute', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [attr('component', 'tool-executor')],
    }));
    expect(span.domain).toBe('tool');
  });

  it('defaults domain to agent', () => {
    const span = convertOtlpSpan(makeOtlpSpan());
    expect(span.domain).toBe('agent');
  });

  it('infers category from span kind', () => {
    const server = convertOtlpSpan(makeOtlpSpan({ kind: 2 }));
    expect(server.category).toBe('server_request');

    const client = convertOtlpSpan(makeOtlpSpan({ kind: 3 }));
    expect(client.category).toBe('client_request');
  });

  it('infers category from span name', () => {
    const llm = convertOtlpSpan(makeOtlpSpan({ name: 'llm.completion', kind: 1 }));
    expect(llm.category).toBe('llm_call');

    const tool = convertOtlpSpan(makeOtlpSpan({ name: 'tool.execute', kind: 1 }));
    expect(tool.category).toBe('tool_call');

    const plan = convertOtlpSpan(makeOtlpSpan({ name: 'agent.planning', kind: 1 }));
    expect(plan.category).toBe('planning');
  });

  it('converts events', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      events: [
        {
          name: 'exception',
          timeUnixNano: 1_700_000_000_100_000_000,
          attributes: [attr('exception.message', 'timeout')],
        },
      ],
    }));
    expect(span.events).toHaveLength(1);
    expect(span.events[0]!.name).toBe('exception');
    expect(span.events[0]!.attributes).toEqual({ 'exception.message': 'timeout' });
  });

  it('converts all attributes to record', () => {
    const span = convertOtlpSpan(makeOtlpSpan({
      attributes: [
        attr('key1', 'value1'),
        attr('key2', 42),
        attr('key3', true),
      ],
    }));
    expect(span.attributes).toEqual({ key1: 'value1', key2: 42, key3: true });
  });
});

// ═══════════════════════════════════════════════════════════════
// TRACE CONVERSION
// ═══════════════════════════════════════════════════════════════

describe('convertOtlpTrace', () => {
  it('converts a group of spans into a trace', () => {
    const root = makeOtlpSpan({ spanId: 'root' });
    const child = makeOtlpSpan({
      spanId: 'child',
      parentSpanId: 'root',
      startTimeUnixNano: 1_700_000_000_050_000_000,
      endTimeUnixNano:   1_700_000_000_150_000_000,
    });

    const trace = convertOtlpTrace([root, child]);
    expect(trace.id).toMatch(/^tr_/);
    expect(trace.rootSpanId).toBe('root');
    expect(trace.spans).toHaveLength(2);
    expect(trace.durationMs).toBe(200);
  });

  it('identifies root span (no parentSpanId)', () => {
    const child = makeOtlpSpan({ spanId: 'child', parentSpanId: 'root' });
    const root = makeOtlpSpan({ spanId: 'root' });

    // Root comes second — should still be identified
    const trace = convertOtlpTrace([child, root]);
    expect(trace.rootSpanId).toBe('root');
  });

  it('falls back to first span if no root found', () => {
    const s1 = makeOtlpSpan({ spanId: 's1', parentSpanId: 'external' });
    const s2 = makeOtlpSpan({ spanId: 's2', parentSpanId: 'external' });

    const trace = convertOtlpTrace([s1, s2]);
    expect(trace.rootSpanId).toBe('s1');
  });

  it('aggregates total tokens and cost', () => {
    const s1 = makeOtlpSpan({
      spanId: 's1',
      attributes: [
        attr('gen_ai.usage.prompt_tokens', 100),
        attr('gen_ai.usage.completion_tokens', 50),
        attr('gen_ai.usage.cost', 0.01),
      ],
    });
    const s2 = makeOtlpSpan({
      spanId: 's2',
      parentSpanId: 's1',
      attributes: [
        attr('gen_ai.usage.prompt_tokens', 200),
        attr('gen_ai.usage.completion_tokens', 100),
        attr('gen_ai.usage.cost', 0.02),
      ],
    });

    const trace = convertOtlpTrace([s1, s2]);
    expect(trace.totalTokens).toBe(450); // 150 + 300
    expect(trace.totalCost).toBeCloseTo(0.03);
  });

  it('sets overall status to error if any span has error', () => {
    const s1 = makeOtlpSpan({ spanId: 's1', status: { code: OtlpStatusCode.OK } });
    const s2 = makeOtlpSpan({
      spanId: 's2',
      parentSpanId: 's1',
      status: { code: OtlpStatusCode.ERROR },
    });

    const trace = convertOtlpTrace([s1, s2]);
    expect(trace.status).toBe('error');
  });

  it('sets overall status to ok when all spans ok', () => {
    const s1 = makeOtlpSpan({ spanId: 's1' });
    const s2 = makeOtlpSpan({ spanId: 's2', parentSpanId: 's1' });

    const trace = convertOtlpTrace([s1, s2]);
    expect(trace.status).toBe('ok');
  });

  it('accepts sessionId parameter', () => {
    const trace = convertOtlpTrace([makeOtlpSpan()], 'sess-123');
    expect(trace.sessionId).toBe('sess-123');
  });

  it('defaults sessionId to empty string', () => {
    const trace = convertOtlpTrace([makeOtlpSpan()]);
    expect(trace.sessionId).toBe('');
  });

  it('throws on empty span array', () => {
    expect(() => convertOtlpTrace([])).toThrow('Cannot convert empty span list');
  });
});
