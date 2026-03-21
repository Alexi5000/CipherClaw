---
name: cipherclaw
description: Zero-dependency AI agent debugging toolkit. Trace errors, build causal graphs, detect anomalies, and monitor behavioral drift across agent sessions.
version: 1.0.3
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

# CipherClaw — AI Agent Debugger

You are an AI agent. CipherClaw is your debugging toolkit. Use it when something goes wrong with an agent run and you need to find out **why** — not just **what** broke.

## When to Use CipherClaw

Use CipherClaw when:
- An agent produced an unexpected result and you need root cause analysis
- You need to understand why an agent's behavior changed over time
- You want to predict failures before they happen
- You need to check if an agent's personality is drifting from its definition
- You suspect cascading failures across multiple domains
- You need a structured debug report for a completed session

## How to Use CipherClaw

CipherClaw works as a debug session. Start a session, feed it traces, then ask it questions.

### 1. Start a Debug Session

```typescript
import { createCipherClaw } from 'cipherclaw';

const cc = createCipherClaw();
const session = cc.startSession({ domain: 'agent' });
```

### 2. Feed It Data

Ingest traces from the agent run you want to debug:

```typescript
cc.ingestTrace(trace);       // Full trace with spans
cc.ingestSpan(span);         // Individual span
```

Or convert OpenTelemetry traces first:

```typescript
import { convertOtlpSpan, convertOtlpTrace } from 'cipherclaw/engine';

const ccTrace = convertOtlpTrace(otlpSpans);
cc.ingestTrace(ccTrace);
```

### 3. Get Answers

| What You Need | What to Call | What You Get |
|---------------|-------------|-------------|
| Root cause of a failure | `cc.getCausalGraph()` | Directed graph with `rootCauses`, `criticalPath`, `impactedNodes` |
| Classify an error | `cc.classifyError(message)` | `{ module, severity, recoverability, suggestedFix }` |
| Detect anomalies | `cc.detectAnomalies(spans)` | Array of anomalies with expected ranges and severity |
| Predict upcoming failures | `cc.getPredictions()` | `[{ predictedFailureType, confidence, timeToFailureMs, suggestedAction }]` |
| Check agent behavior drift | `cc.computeCognitiveFingerprint(agentId)` | `{ driftScore, driftDirection, driftDetails }` |
| Check soul/personality drift | `cc.analyzeSoulIntegrity(agentId, soulDef, behavior)` | `{ overallScore, dimensions, driftEvents, recommendations }` |
| Check memory health | `cc.analyzeMemoryHealth(memoryState)` | `{ overallHealth, tiers, issues, recommendations }` |
| Cross-domain correlations | `cc.detectCrossDomainCorrelations()` | Array of correlations across domains |
| Auto-generate tests | `cc.synthesizeFlowTest(traceId)` | Generated flow test from observed trace |
| Full debug report | `cc.generateReport()` | Complete Veronica report with all findings |
| Self-diagnostics | `cc.selfDebug()` | `{ healthy, issues, actions }` |

### 4. Complete the Session

```typescript
const report = cc.completeSession();
// report.veronicaReport has the full analysis
```

## Commands

| Action | Method |
|--------|--------|
| Find root causes | `getCausalGraph()`, `getRootCauses()` |
| Classify error | `classifyError(message)` |
| Profile behavior | `computeCognitiveFingerprint(agentId)` |
| Check soul drift | `analyzeSoulIntegrity(agentId, soul, behavior)` |
| Predict failures | `getPredictions()` |
| Check memory | `analyzeMemoryHealth(memoryState)` |
| Cross-domain | `detectCrossDomainCorrelations()` |
| Generate tests | `synthesizeFlowTest(traceId)` |
| Full report | `generateReport()` |
| Self-diagnose | `selfDebug()` |

## Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| Anomaly threshold | 2.5 σ | Standard deviations for anomaly detection |
| Cascade window | 30s | Time window for cascade detection |
| Soul drift threshold | 15 | Drift alert threshold (0-100 scale) |
| Max snapshots | 200 | Maximum snapshots per session |
| Max traces | 10,000 | Maximum traces per session |

## Requirements

Node.js 18+. No API keys. No external dependencies.

Install: `pnpm add cipherclaw` or `npm install cipherclaw`.

## External Endpoints

| URL | Data Sent |
|-----|-----------|
| _None_ | CipherClaw makes zero network calls. All computation is local. |

## Security & Privacy

No data leaves your machine. CipherClaw is a zero-dependency, pure-computation library. It reads traces you provide and returns structured analysis. No telemetry. No cloud calls. No API keys. No filesystem writes.

Compatible with NemoClaw OpenShell sandboxes — requires zero network egress and zero filesystem writes outside `/sandbox` and `/tmp`.

All analysis runs in-process. Trace data stays in the debug session and is never persisted or transmitted.

## Model Invocation

CipherClaw does **not** invoke any AI models. All analysis is performed using statistical algorithms, z-score thresholds, pattern matching, and graph traversal. No LLM calls. No inference requests. No model API keys required.

## Trust

By using this skill, no data is transmitted externally. CipherClaw operates entirely within your local environment with zero runtime dependencies. Source code is open and auditable at https://github.com/Alexi5000/CipherClaw. Licensed under Apache-2.0.

Only install this skill if you trust [ClawLI.AI](https://clawli.ai) and have reviewed the source code.
