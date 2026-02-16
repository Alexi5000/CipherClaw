# CipherClaw — Technical Architecture

CipherClaw is an autonomous debug agent built for multi-agent systems. It operates as a first-class agent within the OpenClaw ecosystem — not a passive observer, but an active participant that joins your agent hierarchy, communicates through the event bus, and does the debugging work.

**Domain:** cipherclaw.com  
**License:** Apache 2.0

---

## 1. System Overview

CipherClaw runs as an orchestrator-level agent (Phantom) alongside your other orchestrators. It coordinates specialized sub-agents for trace analysis, error classification, behavioral profiling, and flow testing.

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SOVEREIGN AGENT                      │
│                         │                                   │
│            ┌────────────┼────────────┐                      │
│            │            │            │                      │
│     Your Other      CipherClaw    [Other Orchestrators]     │
│   Orchestrators   (Bug Hunter)                              │
│                     │                                       │
│         ┌───────────┼───────────┐                           │
│         │           │           │                           │
│    Trace        Error       Flow                            │
│    Analyst    Classifier   Tester                           │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

CipherClaw follows 8 principles that guide every design decision:

| Principle | What It Means |
|-----------|--------------|
| **Agent-First** | CipherClaw IS an agent, not just a tool. It reasons, plans, and acts. |
| **Hierarchy-Aware** | Understands sovereign → orchestrator → specialist → worker relationships. |
| **Causal, Not Correlational** | Builds causal dependency graphs, not just correlation heatmaps. |
| **Predictive** | Detects failure patterns before they manifest as errors. |
| **Self-Debugging** | Can debug its own sub-agents recursively. |
| **Cross-Domain** | Debugs both business logic (CRM/content) and agent reasoning simultaneously. |
| **Memory-Native** | Understands and debugs multi-tier memory systems. |
| **OpenClaw-Native** | First-class citizen in the OpenClaw ecosystem. |

---

## 2. Core Architecture Layers

### Layer 1: Trace Ingestion Pipeline

The ingestion pipeline accepts traces from multiple sources and normalizes them into a unified format for analysis.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  OTel Spans  │───▶│  Normalizer  │───▶│  Trace Store │
│  Agent Events│    │  Enricher    │    │  (In-Memory) │
│  Memory Ops  │    │  Correlator  │    │              │
│  Tool Calls  │    │              │    │              │
│  LLM Calls   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  Causal Graph     │
                                    │  Builder          │
                                    │  (DAG Engine)     │
                                    └──────────────────┘
```

**Ingestion sources:** OpenTelemetry spans, agent event bus messages, memory operations (read/write/decay/promote), tool call traces, LLM API calls, CRM pipeline events, and content pipeline events.

### Layer 2: Analysis Engines

Nine independent analysis engines run against the ingested data. Each engine is self-contained and can be used independently.

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYSIS ENGINES                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │   Causal     │  │  Cognitive   │  │   Predictive    │     │
│  │   Inference  │  │  Fingerprint │  │   Failure       │     │
│  │   Engine     │  │  Engine      │  │   Engine        │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │   Error      │  │  Memory      │  │   Soul          │     │
│  │   Taxonomy   │  │  Debugger    │  │   Integrity     │     │
│  │   Engine     │  │              │  │   Monitor       │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │   Breakpoint │  │  Flow Test   │  │   Anomaly       │     │
│  │   Engine     │  │  Synthesizer │  │   Detector      │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Layer 3: Action Layer

The action layer takes analysis results and does something with them — generates reports, escalates alerts, suggests fixes, or propagates events through the hierarchy.

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTION LAYER                              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │  Auto-Fix    │  │  Alert       │  │   Report        │     │
│  │  Suggestions │  │  Escalation  │  │   Generator     │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │  Replay      │  │  Hierarchy   │  │   Self-Debug    │     │
│  │  Engine      │  │  Propagation │  │   Loop          │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 10 Core Capabilities

Each capability is independently implemented and tested. For detailed descriptions and the research behind each approach, see [INNOVATIONS.md](INNOVATIONS.md).

| # | Capability | Engine Component |
|---|-----------|-----------------|
| 1 | Causal Debug Graph | Causal Inference Engine |
| 2 | Cognitive Fingerprinting | Cognitive Fingerprint Engine |
| 3 | Hierarchical Debug Propagation | Hierarchy Propagation |
| 4 | Multi-Tier Memory Debugging | Memory Debugger |
| 5 | Predictive Failure Engine | Predictive Failure Engine |
| 6 | Soul Integrity Monitoring | Soul Integrity Monitor |
| 7 | Cross-Domain Correlation | Error Taxonomy Engine |
| 8 | Self-Debugging Agent Loop | Self-Debug Loop |
| 9 | Flow Test Synthesis | Flow Test Synthesizer |
| 10 | Temporal Anomaly Cascade Detection | Anomaly Detector |

---

## 4. Agent Architecture

### Phantom (CipherClaw Debug Orchestrator)

Phantom is the primary agent. It coordinates all debugging activity and reports results to the sovereign agent.

| Property | Value |
|----------|-------|
| Tier | Orchestrator (Level 2) |
| Reports to | Your sovereign agent |
| Personality | Methodical, relentless, precise |
| Skills | debug-orchestration, trace-analysis, error-classification, flow-testing, causal-inference, predictive-analysis, memory-debugging, soul-monitoring |

### Sub-Agents

| Agent | Tier | Role |
|-------|------|------|
| Trace Analyst | Specialist (L3) | Ingests traces, builds causal graphs, profiles latency |
| Error Classifier | Specialist (L3) | Categorizes errors, scores severity, suggests fixes, predicts failures |
| Cognitive Profiler | Specialist (L3) | Fingerprints agent behavior, monitors soul integrity |
| Flow Tester | Worker (L4) | Synthesizes and runs integration tests, measures coverage |

---

## 5. Data Models

### DebugSession

```typescript
interface DebugSession {
  id: string;
  status: 'idle' | 'hunting' | 'paused' | 'reporting' | 'completed';
  domain: 'agent' | 'crm' | 'content' | 'memory' | 'all';
  targetAgentId: string | null;
  startedAt: number;
  endedAt: number | null;
  causalGraph: CausalNode[];
  cognitiveFingerprint: CognitiveFingerprint | null;
  errors: ClassifiedError[];
  breakpoints: Breakpoint[];
  snapshots: StateSnapshot[];
  flowTests: FlowTest[];
  anomalies: Anomaly[];
  predictions: FailurePrediction[];
  soulIntegrityScore: number | null;
  memoryHealth: MemoryHealthReport | null;
  veronicaReport: VeronicaDebugReport | null;
}
```

### CausalNode

```typescript
interface CausalNode {
  id: string;
  spanId: string;
  agentId: string | null;
  operation: string;
  domain: DebugDomain;
  timestamp: number;
  durationMs: number;
  status: 'ok' | 'warning' | 'error' | 'critical';
  parents: string[];           // causal predecessors
  children: string[];          // causal successors
  rootCauseProbability: number; // 0-1
  metadata: Record<string, unknown>;
}
```

### CognitiveFingerprint

```typescript
interface CognitiveFingerprint {
  agentId: string;
  sessionId: string;
  timestamp: number;
  metrics: {
    avgResponseLatencyMs: number;
    toolSelectionEntropy: number;
    planningDepth: number;
    reasoningTokenRatio: number;
    errorRecoveryRate: number;
    memoryUtilization: number;
    delegationFrequency: number;
    escalationRate: number;
  };
  baseline: CognitiveFingerprint['metrics'] | null;
  driftScore: number;           // 0-100
  driftDirection: 'improving' | 'degrading' | 'stable' | 'unknown';
}
```

### FailurePrediction

```typescript
interface FailurePrediction {
  id: string;
  timestamp: number;
  predictedFailureType: string;
  confidence: number;            // 0-1
  timeToFailureMs: number;
  evidenceSpanIds: string[];
  suggestedAction: string;
  domain: DebugDomain;
  agentId: string | null;
  resolved: boolean;
}
```

---

## 6. Integration Points

### OpenClaw Integration

CipherClaw integrates with any OpenClaw system through three mechanisms:

| Mechanism | How |
|-----------|-----|
| Skill Manifest | Registers as an OpenClaw skill via SKILL.md and manifest.ts |
| Event Bus | Publishes and subscribes to events through the standard OpenClaw event bus |
| Agent Registry | Registers Phantom and sub-agents in the OpenClaw agent hierarchy |

### External Integration

| Integration | Protocol |
|-------------|----------|
| Trace Ingestion | OpenTelemetry OTLP compatible |
| Persistence | Supabase (Postgres) or any SQL store |
| Programmatic Access | TypeScript API (npm package) |
| Real-time Streaming | Event subscription via `on()` / `onAny()` |

---

## 7. Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (100%) |
| Runtime | Node.js 18+ / Browser / Deno / Bun |
| Testing | Vitest (206 tests) |
| Dependencies | Zero runtime dependencies |
| Package Manager | pnpm |
| Architecture | OpenClaw Agent Standard |
