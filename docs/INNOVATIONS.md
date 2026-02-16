# CipherClaw — Novel Approaches

This document describes the 10 novel debugging approaches implemented in CipherClaw. Each one addresses a gap in existing AI agent debugging tools and is independently tested in the [test suite](../src/__tests__/).

Some of these approaches may be subject to intellectual property protections. See the [LICENSE](../LICENSE) for usage terms.

---

## Overview

Existing debug tools were built for single-agent chains. They show flat trace timelines and call it observability. That works when you have one agent calling one tool. It breaks when you have hierarchies of agents delegating across domains, writing to shared memory, and evolving their behavior over time.

CipherClaw introduces 10 approaches that go beyond trace viewing:

| # | Approach | Core Idea |
|---|---------|-----------|
| 1 | Causal Debug Graph | Build a DAG of error propagation with root cause scoring |
| 2 | Cognitive Fingerprinting | Profile agent behavior across 8 dimensions, detect drift |
| 3 | Hierarchical Debug Propagation | Route debug events through agent command structures |
| 4 | Multi-Tier Memory Debugging | Analyze health across 5 cognitive memory tiers |
| 5 | Predictive Failure Engine | Predict failures before they happen using pattern matching |
| 6 | Soul Integrity Monitoring | Verify agent personality and value adherence |
| 7 | Cross-Domain Correlation | Find shared failures across agent, CRM, content, infra |
| 8 | Self-Debugging Agent Loop | The debugger monitors and repairs itself |
| 9 | Flow Test Synthesis | Generate integration tests from observed traces |
| 10 | Temporal Anomaly Cascade Detection | Identify cascading failure patterns in time windows |

---

## 1. Causal Debug Graph

**Problem:** When an error occurs in a multi-agent system, you see the error but not what caused it. Flat trace timelines don't show causal relationships.

**Approach:** CipherClaw constructs a directed acyclic graph from execution spans. Each node stores the span data plus a root cause probability score computed from three signals:

- Whether the node is the earliest error in its trace (weight: 0.4)
- The number of downstream error nodes reachable from it (weight: 0.3)
- The absence of incoming error edges (weight: 0.3)

Root causes are nodes with scores above a configurable threshold. You can traverse the graph forward (what did this error cause?) or backward (what caused this error?).

**Tested in:** `unit-core-capabilities.test.ts` — graph construction, root cause identification, critical path computation.

---

## 2. Cognitive Fingerprinting

**Problem:** Agents change behavior over time — different model versions, prompt drift, context window pollution. You need to know when an agent starts acting differently.

**Approach:** CipherClaw collects behavioral metrics from an agent's execution history and computes an 8-dimensional fingerprint vector:

- Tool usage frequency distribution
- Average planning depth
- Error recovery success rate
- Delegation frequency
- Memory access patterns
- Response time distributions
- Decision consistency
- Communication style adherence

The current fingerprint is compared against a stored baseline using Euclidean distance. A drift score (0-100) indicates how much the agent has changed. The drift direction identifies which dimension changed most.

**Tested in:** `unit-core-capabilities.test.ts` — fingerprint computation, drift detection, dimension analysis.

---

## 3. Hierarchical Debug Propagation

**Problem:** In a multi-agent hierarchy (sovereign → orchestrator → specialist → worker), debug events need to flow through the command structure. A worker error should reach its orchestrator. A system-wide alert should reach all workers.

**Approach:** CipherClaw routes debug events through the agent hierarchy with three propagation directions:

- **Up:** Error escalation from child to parent, all the way to sovereign
- **Down:** Debug requests from parent to specific children or broadcast to all
- **Lateral:** Status reports between peers at the same tier level

At each node, the event can be forwarded, handled, or broadcast. The complete propagation path is recorded for audit and replay.

**Tested in:** `unit-core-capabilities.test.ts` — up/down/lateral propagation, path recording.

---

## 4. Multi-Tier Memory Debugging

**Problem:** Advanced agents use tiered memory systems (working, short-term, episodic, semantic, archival). When memory goes wrong, you need to know which tier is failing and why.

**Approach:** CipherClaw analyzes each memory tier independently:

- **Item count** relative to expected capacity
- **Average decay rate** — are memories expiring too fast?
- **Retrieval hit rate** — is the agent finding what it needs?
- **Tier-specific issues** — stale data, capacity overflow, empty tiers

Per-tier health scores are computed as weighted averages of these metrics. An overall memory health score aggregates all tiers. Actionable recommendations are generated for each issue found.

**Tested in:** `unit-core-capabilities.test.ts` — tier analysis, health scoring, issue detection.

---

## 5. Predictive Failure Engine

**Problem:** Existing tools tell you what broke. They don't tell you what's about to break.

**Approach:** CipherClaw maintains a library of 6 failure patterns, each with indicator conditions and confidence weights:

- Error rate spike → imminent cascade
- Token budget exhaustion → agent will stop mid-task
- Memory tier degradation → retrieval failures incoming
- Tool timeout clustering → external service degradation
- Planning depth increase → agent confusion spiral
- Delegation chain lengthening → hierarchy bottleneck

Each pattern's indicators are continuously evaluated against session state. When a pattern's weighted match score exceeds a threshold, a prediction is generated with confidence score, matched indicators, and recommended preventive action.

Prediction lifecycle is tracked from generation through resolution, including whether the predicted failure actually occurred.

**Tested in:** `unit-core-capabilities.test.ts` — pattern matching, prediction generation, lifecycle tracking.

---

## 6. Soul Integrity Monitoring

**Problem:** Agents have defined personalities, values, and communication styles (their "soul prompt"). Over time, they can drift from these definitions. You need to know when.

**Approach:** CipherClaw compares an agent's observed behavior against its soul prompt definition across three dimensions:

- **Personality adherence** — Are the defined traits reflected in behavior?
- **Value adherence** — Are the defined values being upheld in decisions?
- **Style adherence** — Does the communication style match the definition?

Each dimension gets an adherence score (0-100). An overall soul integrity score is the weighted average. Drift events are generated when any dimension drops below a configurable threshold, identifying exactly which traits or values are being violated.

**Tested in:** `unit-core-capabilities.test.ts` — integrity scoring, drift detection, dimension analysis.

---

## 7. Cross-Domain Correlation

**Problem:** A single broken API can cause failures across agent operations, CRM pipelines, and content publishing simultaneously. Domain-specific tools can't see the connection.

**Approach:** CipherClaw collects classified errors from all domains within a session and computes correlation scores for each domain pair based on:

- Temporal proximity (errors within a configurable time window)
- Shared error modules or categories
- Shared dependency chains in the causal graph

Correlated error pairs are traced back through the causal graph to find common ancestor nodes (shared root causes). Cross-domain reports identify which domains are experiencing related failures and what the shared dependencies are.

**Tested in:** `e2e-session-lifecycle.test.ts` — multi-domain ingestion, correlation detection.

---

## 8. Self-Debugging Agent Loop

**Problem:** What happens when the debugger has a bug? In production, you need the debug system to be self-aware.

**Approach:** CipherClaw instruments itself with the same capabilities it applies to target systems. A periodic self-diagnostic routine checks:

- Engine state consistency
- Session data integrity
- Memory usage bounds
- Processing latency bounds

Self-detected issues are classified using the same error classification matrix. Recoverable issues trigger automated self-repair (clearing corrupted data, resetting stuck pipelines, garbage collecting expired resources). All diagnostics and repairs are logged in a self-debug audit trail.

**Tested in:** `unit-core-capabilities.test.ts` — self-diagnostic execution, health assessment, audit logging.

---

## 9. Flow Test Synthesis

**Problem:** Writing integration tests for agent systems is tedious. Your production runs already demonstrate the expected behavior — why not turn them into tests?

**Approach:** CipherClaw analyzes completed execution traces and generates flow test definitions:

- Each span becomes a test step with assertions based on observed outcomes
- Key decision points are identified where execution branched
- Domain classification is inferred from span categories

Generated tests can be run against the live system to detect regressions. Test coverage is computed as the percentage of observed execution paths with corresponding flow tests.

CipherClaw also ships 8 built-in flow tests covering common patterns: agent boot → plan → execute → memory write, CRM lead capture → enrichment → outreach, content creation → approval → publish, and more.

**Tested in:** `unit-core-capabilities.test.ts` — test synthesis, flow execution, coverage computation.

---

## 10. Temporal Anomaly Cascade Detection

**Problem:** Individual anomalies are noise. Cascading anomalies are a system failure in progress. You need to distinguish between the two.

**Approach:** CipherClaw maintains a time-ordered buffer of detected anomalies and scans for cascade patterns:

- Anomalies within a configurable time window (default: 30 seconds)
- Progression patterns (latency spike → error burst → resource exhaustion)
- Minimum cascade length (default: 3 anomalies)

For each detected cascade, CipherClaw computes duration, affected component count, peak severity, and estimated blast radius. Cascades are correlated with causal graph paths to identify the initiating event.

**Tested in:** `unit-core-capabilities.test.ts` — anomaly detection, cascade grouping, z-score computation.

---

## Architecture Diagrams

These diagrams illustrate the system architecture and data flow:

- **[System Architecture](diagrams/architecture.png)** — CipherClaw within an OpenClaw agent hierarchy
- **[Agent Hierarchy](diagrams/agent-hierarchy.png)** — Phantom and sub-agent structure
- **[Causal Debug Graph](diagrams/causal-debug-graph.png)** — Example CDG with root cause scoring
- **[Debug Session Flow](diagrams/debug-session-flow.png)** — Complete session lifecycle

---

## Comparison with Existing Tools

| Approach | CipherClaw | LangSmith | Maxim | Arize | Blinky |
|----------|-----------|-----------|-------|-------|--------|
| Causal Debug Graph | Yes | — | — | — | — |
| Cognitive Fingerprinting | Yes | — | — | — | — |
| Hierarchy Propagation | Yes | — | — | — | — |
| Memory Tier Debugging | Yes | — | — | — | — |
| Predictive Failure | Yes | — | — | — | — |
| Soul Integrity | Yes | — | — | — | — |
| Cross-Domain Correlation | Yes | — | Partial | — | — |
| Self-Debugging | Yes | — | — | — | — |
| Flow Test Synthesis | Yes | — | — | — | — |
| Anomaly Cascades | Yes | — | — | — | — |
| OpenClaw Compatible | Yes | — | — | — | — |
