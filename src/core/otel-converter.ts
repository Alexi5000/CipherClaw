// CipherClaw — OpenTelemetry (OTLP) to CipherClaw trace converter.
//
// Converts standard OTLP span data into CipherClaw's Span and Trace types.
// This bridges OpenTelemetry-compatible systems (Opik, Jaeger, etc.) into
// CipherClaw's analysis pipeline without requiring CipherClaw-specific
// trace formats.
//
// Zero dependencies. Pure functions.

import type { Span, Trace, DebugDomain, SpanEvent } from '../types/index.js';
import { uid } from './utils.js';

// ═══════════════════════════════════════════════════════════════
// OTLP TYPES (subset of the OpenTelemetry proto spec)
// ═══════════════════════════════════════════════════════════════

/** Standard OTLP status codes (opentelemetry-proto). */
export enum OtlpStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

/** A single key-value attribute from OTLP. */
export interface OtlpAttribute {
  key: string;
  value: { stringValue?: string; intValue?: number; doubleValue?: number; boolValue?: boolean };
}

/** An event attached to an OTLP span. */
export interface OtlpSpanEvent {
  name: string;
  timeUnixNano: number;
  attributes: OtlpAttribute[];
}

/** Standard OTLP span shape (simplified — covers the fields CipherClaw needs). */
export interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number; // 0=UNSPECIFIED, 1=INTERNAL, 2=SERVER, 3=CLIENT, 4=PRODUCER, 5=CONSUMER
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes: OtlpAttribute[];
  events: OtlpSpanEvent[];
  status: { code: OtlpStatusCode; message?: string };
}

// ═══════════════════════════════════════════════════════════════
// ATTRIBUTE HELPERS
// ═══════════════════════════════════════════════════════════════

function getAttrValue(attrs: OtlpAttribute[], key: string): string | number | boolean | undefined {
  const attr = attrs.find(a => a.key === key);
  if (!attr) return undefined;
  const v = attr.value;
  return v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue;
}

function getAttrString(attrs: OtlpAttribute[], key: string): string | null {
  const v = getAttrValue(attrs, key);
  return typeof v === 'string' ? v : null;
}

function getAttrNumber(attrs: OtlpAttribute[], key: string): number {
  const v = getAttrValue(attrs, key);
  return typeof v === 'number' ? v : 0;
}

function attrsToRecord(attrs: OtlpAttribute[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of attrs) {
    out[a.key] = a.value.stringValue ?? a.value.intValue ?? a.value.doubleValue ?? a.value.boolValue ?? null;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════
// STATUS MAPPING
// ═══════════════════════════════════════════════════════════════

function mapStatus(status: OtlpSpan['status']): 'ok' | 'warning' | 'error' | 'critical' {
  switch (status.code) {
    case OtlpStatusCode.OK: return 'ok';
    case OtlpStatusCode.ERROR: return 'error';
    default: return 'ok';
  }
}

// ═══════════════════════════════════════════════════════════════
// DOMAIN INFERENCE
// ═══════════════════════════════════════════════════════════════

// Attempts to infer the CipherClaw debug domain from OTLP attributes.
function inferDomain(attrs: OtlpAttribute[]): DebugDomain {
  const domain = getAttrString(attrs, 'cipherclaw.domain')
    ?? getAttrString(attrs, 'debug.domain');
  if (domain && ['agent', 'crm', 'content', 'memory', 'tool', 'hierarchy'].includes(domain)) {
    return domain as DebugDomain;
  }

  // Heuristic inference from standard OpenTelemetry semconv attributes
  const component = getAttrString(attrs, 'component') ?? '';
  if (component.includes('memory') || component.includes('cache')) return 'memory';
  if (component.includes('tool') || component.includes('function')) return 'tool';
  if (component.includes('agent') || component.includes('llm')) return 'agent';

  return 'agent'; // Default
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY INFERENCE
// ═══════════════════════════════════════════════════════════════

function inferCategory(span: OtlpSpan): string {
  // Check standard OpenTelemetry attributes first
  const kind = span.kind;
  if (kind === 2) return 'server_request';
  if (kind === 3) return 'client_request';
  if (kind === 4) return 'producer';
  if (kind === 5) return 'consumer';

  // Check common naming patterns
  const name = span.name.toLowerCase();
  if (name.includes('llm') || name.includes('model') || name.includes('completion')) return 'llm_call';
  if (name.includes('tool') || name.includes('function_call')) return 'tool_call';
  if (name.includes('plan') || name.includes('reason')) return 'planning';
  if (name.includes('memory') || name.includes('retriev')) return 'memory_operation';
  if (name.includes('embed')) return 'embedding';

  return 'general';
}

// ═══════════════════════════════════════════════════════════════
// SPAN CONVERSION
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a single OTLP span to a CipherClaw Span.
 *
 * Maps standard OTLP fields to CipherClaw's format:
 * - `spanId` → `id`
 * - `parentSpanId` → `parentSpanId` (null if empty/root)
 * - `startTimeUnixNano/endTimeUnixNano` → millisecond timestamps
 * - `status.code` → CipherClaw status enum
 * - Token usage extracted from `gen_ai.*` or `llm.*` attributes
 * - Domain inferred from attributes or defaults to 'agent'
 */
export function convertOtlpSpan(otlp: OtlpSpan): Span {
  const startMs = Math.floor(otlp.startTimeUnixNano / 1_000_000);
  const endMs = Math.floor(otlp.endTimeUnixNano / 1_000_000);
  const durationMs = endMs - startMs;

  // Extract token usage from common OTLP semantic conventions for GenAI
  const promptTokens = getAttrNumber(otlp.attributes, 'gen_ai.usage.prompt_tokens')
    || getAttrNumber(otlp.attributes, 'llm.token_count.prompt');
  const completionTokens = getAttrNumber(otlp.attributes, 'gen_ai.usage.completion_tokens')
    || getAttrNumber(otlp.attributes, 'llm.token_count.completion');
  const totalTokens = promptTokens + completionTokens;

  // Extract cost if present
  const cost = getAttrNumber(otlp.attributes, 'gen_ai.usage.cost')
    || getAttrNumber(otlp.attributes, 'llm.cost');

  // Convert OTLP events to CipherClaw SpanEvents
  const events: SpanEvent[] = otlp.events.map(e => ({
    name: e.name,
    timestamp: Math.floor(e.timeUnixNano / 1_000_000),
    attributes: attrsToRecord(e.attributes),
  }));

  return {
    id: otlp.spanId,
    traceId: otlp.traceId,
    parentSpanId: otlp.parentSpanId || null,
    name: otlp.name,
    category: inferCategory(otlp),
    agentId: getAttrString(otlp.attributes, 'agent.id')
      ?? getAttrString(otlp.attributes, 'cipherclaw.agent_id')
      ?? null,
    domain: inferDomain(otlp.attributes),
    startTime: startMs,
    endTime: endMs,
    durationMs,
    status: mapStatus(otlp.status),
    attributes: attrsToRecord(otlp.attributes),
    events,
    tokenUsage: totalTokens > 0
      ? { prompt: promptTokens, completion: completionTokens, total: totalTokens }
      : undefined,
    cost: cost > 0 ? cost : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// TRACE CONVERSION
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a group of OTLP spans (belonging to the same trace) into a CipherClaw Trace.
 *
 * All spans must share the same `traceId`. The root span is the one with
 * no `parentSpanId`. If no root is found, the first span is used.
 */
export function convertOtlpTrace(otlpSpans: OtlpSpan[], sessionId?: string): Trace {
  if (otlpSpans.length === 0) {
    throw new Error('Cannot convert empty span list to trace');
  }

  const spans = otlpSpans.map(convertOtlpSpan);
  const root = spans.find(s => !s.parentSpanId) ?? spans[0]!;
  const traceId = otlpSpans[0]!.traceId;

  const startTime = Math.min(...spans.map(s => s.startTime));
  const endTime = Math.max(...spans.map(s => s.endTime));

  const totalTokens = spans.reduce((sum, s) => sum + (s.tokenUsage?.total ?? 0), 0);
  const totalCost = spans.reduce((sum, s) => sum + (s.cost ?? 0), 0);

  // Determine overall status: worst status wins
  const hasError = spans.some(s => s.status === 'error' || s.status === 'critical');
  const hasWarning = spans.some(s => s.status === 'warning');
  const status = hasError ? 'error' as const : hasWarning ? 'warning' as const : 'ok' as const;

  return {
    id: uid('tr'),
    sessionId: sessionId ?? '',
    rootSpanId: root.id,
    spans,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    agentId: root.agentId,
    domain: root.domain,
    status,
    totalTokens,
    totalCost,
  };
}
