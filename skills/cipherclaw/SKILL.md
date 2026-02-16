---
name: cipherclaw
description: Debug agent that traces error causes, profiles agent behavior, and predicts failures in multi-agent systems.
user-invocable: true
---

# CipherClaw Debug Agent

When the user asks you to debug an agent system, trace errors, or analyze agent behavior, use CipherClaw.

## Capabilities

- Classify errors by module, severity, and suggested fix
- Build causal graphs showing how errors propagate between agents
- Profile agent behavior and detect when agents start acting differently
- Predict failures before they happen
- Check if agents are staying true to their defined personality
- Analyze memory health across working, episodic, semantic, and archival tiers
- Find correlated failures across different domains (agent, CRM, content)
- Generate integration tests from observed execution traces
- Detect cascading failure patterns

## Usage Examples

"Debug my agent swarm and find the root cause of the errors"
"Profile the behavior of agent-alpha and check for drift"
"Run a health check on the memory system"
"Predict what's about to break in my agent pipeline"
"Check if my agents are still following their soul prompts"
"Find correlated failures across my CRM and agent systems"
"Generate integration tests from the last debug session"

## Requirements

- Node.js 18+ or compatible runtime
- TypeScript 5.x (for type-safe usage)
- No external API keys required
- No external dependencies

## How It Works

CipherClaw operates as an orchestrator-level agent (Phantom) with four sub-agents:

1. **Trace Analyst** — ingests execution traces and builds causal graphs
2. **Error Classifier** — categorizes errors and scores severity
3. **Cognitive Profiler** — fingerprints agent behavior and detects drift
4. **Flow Tester** — synthesizes and runs integration tests

It communicates through the standard OpenClaw event bus and respects agent hierarchy. Drop it into any OpenClaw system and it starts working.

## Events Emitted

- `error-classified` — when an error is categorized
- `anomaly-detected` — when a statistical anomaly is found
- `cascade-detected` — when a cascading failure pattern is identified
- `prediction-generated` — when a failure is predicted
- `breakpoint-hit` — when a breakpoint condition triggers
- `soul-drift-detected` — when agent personality drift is detected
- `cognitive-drift-detected` — when agent behavioral drift is detected

## Quick Start

```typescript
import { createCipherClaw } from 'cipherclaw';

const cc = createCipherClaw();
const session = cc.startSession({ domain: 'agent' });

// Feed it traces, get back analysis
cc.ingestTrace(yourTrace);
const graph = cc.getCausalGraph();
const report = cc.generateReport();

cc.completeSession();
```
