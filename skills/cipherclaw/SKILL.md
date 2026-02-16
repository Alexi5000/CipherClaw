---
name: cipherclaw
description: Debug agent swarms — trace root causes, profile agent behavior, predict failures, check soul drift, analyze memory health.
user-invocable: true
metadata: {"openclaw":{"emoji":"🔍","homepage":"https://cipherclaw.com","requires":{"bins":["node"]}}}
---

# CipherClaw Debug Agent

When the user asks to debug agents, trace errors, find root causes, check agent behavior, predict failures, or analyze memory health, use CipherClaw.

## How to Use

1. Start a debug session with `createCipherClaw()` and `cc.startSession({ domain })`.
2. Feed traces via `cc.ingestTrace(trace)`. Each trace has spans with timing, status, and agent metadata.
3. Run analysis — the engine does causal graphing, anomaly detection, and prediction automatically on ingest.
4. Ask specific questions using the methods below.
5. Complete the session with `cc.completeSession()` to get the full Veronica report.

## Available Commands

If the user asks to **find root causes**: call `cc.getCausalGraph()` and `cc.getRootCauses()`. Present the causal graph nodes sorted by root cause probability.

If the user asks to **classify an error**: call `cc.classifyError(message)`. Returns module, severity, recoverability, and suggested fix.

If the user asks to **profile agent behavior**: call `cc.computeCognitiveFingerprint(agentId)`. Returns 8 behavioral dimensions and drift score.

If the user asks to **check soul integrity**: call `cc.analyzeSoulIntegrity(agentId, soulDefinition, behavior)`. Compares defined personality/values against observed behavior.

If the user asks to **predict failures**: call `cc.getPredictions()`. Returns predicted failure types with confidence scores and suggested actions.

If the user asks to **check memory health**: call `cc.analyzeMemoryHealth(memoryState)`. Analyzes all 5 memory tiers and reports issues.

If the user asks to **find cross-domain correlations**: call `cc.detectCrossDomainCorrelations()`. Finds shared failure patterns across agent, CRM, content, and infrastructure domains.

If the user asks to **generate tests**: call `cc.synthesizeFlowTest(traceId)` to create integration tests from observed traces.

If the user asks for a **full health report**: call `cc.generateReport()`. Returns health score, summary, and all findings.

If the user asks to **self-diagnose**: call `cc.selfDebug()`. CipherClaw checks its own engine health.

## Defaults

- Anomaly threshold: 2.5 standard deviations
- Cascade window: 30 seconds
- Soul drift threshold: 15 (0–100 scale)
- Self-debug: enabled
- Hierarchy propagation: enabled
- Max snapshots per session: 50

## When to Stop

- After delivering the Veronica report, the session is complete.
- If no traces are ingested, tell the user what format traces need to be in (see `Trace` and `Span` types).
- If the user asks for something outside debugging scope, say so and suggest the right tool.

## Requirements

- Node.js 18+ or compatible runtime
- No external API keys required
- No external dependencies
- Install: `npm install cipherclaw` or `pnpm add cipherclaw`
