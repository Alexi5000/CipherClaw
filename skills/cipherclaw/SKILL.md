---
name: cipherclaw
description: Zero-dependency AI agent debugging toolkit. Trace errors, build causal graphs, detect anomalies, and monitor behavioral drift across agent sessions.
version: 1.0.2
metadata:
  openclaw:
    emoji: "🔍"
    homepage: https://github.com/Alexi5000/CipherClaw
    requires:
      bins:
        - node
    install:
      - id: npm
        kind: node
        package: cipherclaw
        bins: []
        label: Install CipherClaw (npm)
---

# CipherClaw Skill

Debug AI agent behavior using CipherClaw's modular engine. Start a session, log events, and get structured analysis.

## Quick Start

```typescript
import { CipherClawEngine } from 'cipherclaw';

const engine = new CipherClawEngine();
const session = engine.startSession({ domain: 'reasoning' });
```

## Log an Error

```typescript
engine.logError(session.id, {
  message: 'Agent hallucinated a citation',
  severity: 'high',
  domain: 'reasoning',
  context: { prompt: 'Summarize paper', output: 'Cited non-existent study' }
});
```

## Build Causal Graph

After logging errors, retrieve the causal graph for root cause analysis:

```typescript
const graph = engine.getCausalGraph(session.id);
// { nodes, edges, rootCauses, impactedNodes, criticalPath }
```

## Detect Anomalies

```typescript
engine.logAnomaly(session.id, {
  metric: 'response_latency',
  value: 4500,
  threshold: 2000,
  domain: 'performance'
});
```

## Monitor Soul Integrity

Compare defined personality against observed behavior:

```typescript
const report = engine.analyzeSoulIntegrity(session.id, soulDefinition, observedBehavior);
// { overallScore, violations, recommendations }
```

## Memory Health

```typescript
const health = engine.checkMemoryHealth(session.id, 'all');
// { overallHealth, tiers: { shortTerm, longTerm, episodic, semantic } }
```

## Predictions

```typescript
const predictions = engine.getPredictions(session.id);
// [{ pattern, probability, timeframe, suggestedAction }]
```

## Complete Session

```typescript
const report = engine.completeSession(session.id);
// Full debug report with all findings
```

## Commands

| Action | Method |
|--------|--------|
| Find root causes | `getCausalGraph(sessionId)`, `getRootCauses(sessionId)` |
| Classify error | `classifyError(message)` |
| Profile behavior | `computeCognitiveFingerprint(sessionId, agentId)` |
| Check soul drift | `analyzeSoulIntegrity(sessionId, soul, behavior)` |
| Predict failures | `getPredictions(sessionId)` |
| Check memory | `checkMemoryHealth(sessionId, tier)` |
| Cross-domain | `detectCrossDomainCorrelations(sessionId)` |
| Generate tests | `synthesizeFlowTest(sessionId, traceId)` |
| Full report | `completeSession(sessionId)` |
| Self-diagnose | `selfDebug(sessionId)` |

## Defaults

Anomaly threshold: 2.5 standard deviations. Cascade window: 30s. Soul drift threshold: 15 (0-100). Max snapshots: 50 per session.

## Requirements

Node.js 18+. No API keys. No external dependencies. Install: `pnpm add cipherclaw`.
