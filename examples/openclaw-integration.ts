/**
 * CipherClaw — OpenClaw Integration Example
 *
 * This example shows how to plug CipherClaw into an existing
 * OpenClaw agent system using the skill manifest and event bus.
 *
 * Run with: npx tsx examples/openclaw-integration.ts
 */

import {
  createCipherClaw,
  CIPHERCLAW_MANIFEST,
} from '../src/index';

// ─── 1. Inspect the OpenClaw Manifest ───────────────────────────────────────

console.log('CipherClaw OpenClaw Manifest:');
console.log(`  Name: ${CIPHERCLAW_MANIFEST.name}`);
console.log(`  Version: ${CIPHERCLAW_MANIFEST.version}`);
console.log(`  Agents: ${CIPHERCLAW_MANIFEST.agents.length}`);
console.log(`  Skills: ${CIPHERCLAW_MANIFEST.skills.length}`);
console.log(`  Tools: ${CIPHERCLAW_MANIFEST.tools.length}`);
console.log(`  Events: ${CIPHERCLAW_MANIFEST.events.length}`);
console.log();

// List agents
console.log('Agents:');
CIPHERCLAW_MANIFEST.agents.forEach((a) => {
  console.log(`  ${a.id} (${a.tier}) — ${a.description}`);
});
console.log();

// List skills
console.log('Skills:');
CIPHERCLAW_MANIFEST.skills.forEach((s) => {
  console.log(`  ${s.id} — ${s.description}`);
});
console.log();

// List tools
console.log('Tools:');
CIPHERCLAW_MANIFEST.tools.forEach((t) => {
  console.log(`  ${t.id} — ${t.description}`);
});
console.log();

// ─── 2. Create CipherClaw and wire up events ───────────────────────────────

const cc = createCipherClaw();

// In a real OpenClaw system, you'd wire these to the gateway event bus.
// Here we just log them to show the event flow.

const unsubError = cc.on('error-classified', (event) => {
  console.log(`[gateway] → error-classified: ${event.payload.module}`);
});

const unsubAnomaly = cc.on('anomaly-detected', (event) => {
  console.log(`[gateway] → anomaly-detected: ${event.payload.type}`);
});

const unsubPrediction = cc.on('prediction-generated', (event) => {
  console.log(`[gateway] → prediction-generated: ${event.payload.predictedFailure}`);
});

const unsubSoul = cc.on('soul-drift-detected', (event) => {
  console.log(`[gateway] → soul-drift-detected: score=${event.payload.driftScore}`);
});

const unsubCognitive = cc.on('cognitive-drift-detected', (event) => {
  console.log(`[gateway] → cognitive-drift-detected: score=${event.payload.driftScore}`);
});

// Subscribe to all events at once
const unsubAll = cc.onAny((event) => {
  // This catches everything — useful for logging to your OpenClaw gateway
});

// ─── 3. Simulate an OpenClaw agent system sending traces ────────────────────

const session = cc.startSession({ domain: 'agent' });
console.log(`\nDebug session: ${session.id}\n`);

const now = Date.now();

// Simulate a multi-agent trace
cc.ingestTrace({
  id: 'trace-001',
  sessionId: session.id,
  agentId: 'sovereign-veronica',
  domain: 'agent',
  startTime: now - 10000,
  endTime: now,
  status: 'error',
  spans: [
    {
      id: 's1', traceId: 'trace-001', name: 'veronica.dispatch',
      category: 'planning', startTime: now - 10000, endTime: now - 9000,
      durationMs: 1000, status: 'ok', agentId: 'sovereign-veronica',
      domain: 'agent', metadata: {}, events: [],
    },
    {
      id: 's2', traceId: 'trace-001', name: 'rose.execute_plan',
      category: 'action', startTime: now - 9000, endTime: now - 5000,
      durationMs: 4000, status: 'ok', agentId: 'orchestrator-rose',
      domain: 'agent', metadata: {}, events: [],
    },
    {
      id: 's3', traceId: 'trace-001', name: 'worker.tool_call',
      category: 'action', startTime: now - 5000, endTime: now,
      durationMs: 5000, status: 'error', agentId: 'worker-alpha',
      domain: 'agent', metadata: { error: 'Connection refused' },
      events: [{ type: 'error', message: 'Connection refused to external API', timestamp: now }],
    },
  ],
});

// ─── 4. Use hierarchy propagation ───────────────────────────────────────────

// Escalate the error from worker up to sovereign
const escalation = cc.propagateDebugEvent({
  source: 'worker-alpha',
  target: 'sovereign-veronica',
  direction: 'up',
  eventType: 'error_escalation',
  payload: { error: 'Connection refused to external API', severity: 'high' },
  timestamp: Date.now(),
  path: [],
});

console.log('\nHierarchy Propagation:');
console.log(`  Direction: ${escalation.direction}`);
console.log(`  Path: ${escalation.path.join(' → ')}`);
console.log();

// ─── 5. Generate report ─────────────────────────────────────────────────────

const report = cc.generateReport();
console.log('Debug Report:');
console.log(`  Health: ${report.healthScore}/100`);
console.log(`  Errors: ${report.errorBreakdown.total}`);
console.log(`  Recommendations: ${report.recommendations.length}`);
console.log();

// ─── 6. Clean up ────────────────────────────────────────────────────────────

cc.completeSession();
unsubError();
unsubAnomaly();
unsubPrediction();
unsubSoul();
unsubCognitive();
unsubAll();

console.log('Done. CipherClaw session complete.');
