/**
 * CipherClaw — Capability 9: Flow Test Synthesis & Runner
 * Auto-generates integration tests from observed traces and runs them.
 */

import type {
  DebugSession, FlowTest, FlowTestStep, DebugDomain, Span,
} from '../types/index.js';
import { uid, mean } from './utils.js';

/** Synthesize a flow test from an observed trace. */
export function synthesizeFlowTest(
  session: DebugSession,
  traceId: string,
): FlowTest | null {
  const trace = session.traces.find(t => t.id === traceId);
  if (!trace || trace.spans.length === 0) return null;

  // Build steps from span sequence
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

  session.flowTests.push(flowTest);
  return flowTest;
}

/** Run all flow tests for a session (optionally filtered by domain). */
export function runFlowTests(
  session: DebugSession,
  domain?: DebugDomain,
): { total: number; passed: number; failed: number; coverage: number } {
  const tests = domain
    ? session.flowTests.filter(ft => ft.domain === domain || ft.domain === 'all')
    : session.flowTests;

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    test.startedAt = Date.now();
    test.status = 'running';

    let stepsPassed = 0;
    for (const step of test.steps) {
      step.status = 'running';
      // Match against collected traces
      const matchingSpan = session.traces
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
