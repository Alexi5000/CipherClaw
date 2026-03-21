# CipherClaw × NemoClaw — Deployment & Compatibility Guide

> **NemoClaw** (announced March 16, 2026 at GTC) is NVIDIA's open-source security and privacy stack for OpenClaw.  
> **CipherClaw** is a zero-dependency debugging toolkit for OpenClaw agents.  
> They are **complementary**: NemoClaw provides infrastructure security, CipherClaw provides debugging & observability.

---

## How They Fit Together

```
┌─────────────────────────────────────────────────────────┐
│  NemoClaw (Infrastructure Security)                     │
│  ├── OpenShell Sandbox (kernel-level isolation)          │
│  ├── Policy Engine (deny-by-default filesystem/network)  │
│  ├── Privacy Router (local vs cloud inference routing)   │
│  └── Audit Trail (every allow/deny logged)               │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ CipherClaw (Debugging & Observability)            │  │
│  │ ├── Causal root cause analysis                     │  │
│  │ ├── Cognitive behavioral fingerprinting            │  │
│  │ ├── Predictive failure detection                   │  │
│  │ ├── Soul/personality drift monitoring              │  │
│  │ ├── Multi-tier memory health analysis              │  │
│  │ ├── Cross-domain error correlation                 │  │
│  │ ├── Automated flow test synthesis                  │  │
│  │ └── Zero network calls • Zero dependencies        │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  OpenClaw (Agent Runtime)                               │
│  ├── Skills, Agents, Memory, Gateway, Tools             │
│  └── Opik observability plugin (trace export)           │
└─────────────────────────────────────────────────────────┘
```

NemoClaw secures the sandbox. CipherClaw debugs what happens inside it.

---

## Sandbox Compatibility Matrix

CipherClaw is designed to run inside a NemoClaw OpenShell sandbox with **zero policy violations**.

| Requirement | CipherClaw Status | Notes |
|-------------|------------------|-------|
| **Runtime dependencies** | ✅ Zero | No `node_modules` at runtime — pure TypeScript compiled to JS |
| **Network egress** | ✅ Zero | No HTTP calls, no API keys, no telemetry, no cloud services |
| **Filesystem writes** | ✅ Zero | All state held in memory. No disk I/O. |
| **Filesystem reads** | ✅ `/sandbox` only | Reads traces provided programmatically — no direct FS access |
| **Process privileges** | ✅ Unprivileged | Runs as standard `sandbox` user. No elevated permissions. |
| **Landlock LSM** | ✅ Compatible | No syscalls that would trigger Landlock denials |
| **seccomp** | ✅ Compatible | Standard Node.js syscall profile — no exotic calls |
| **LLM inference** | ✅ None | CipherClaw makes zero model calls. All analysis is algorithmic. |

**CipherClaw is the ideal skill for NemoClaw sandboxes** because it physically cannot violate any security policies.

---

## OpenShell Policy (No Changes Needed)

CipherClaw requires no additions to the default OpenShell sandbox policy:

```yaml
# CipherClaw policy addendum — NONE REQUIRED
#
# Network:    CipherClaw requires zero network egress
# Filesystem: CipherClaw reads traces from memory, writes nothing
# Process:    Standard unprivileged user
#
# The default deny-by-default policy is sufficient.
```

If your sandbox policy already allows Node.js execution, CipherClaw works as-is.

---

## Deployment Inside a NemoClaw Sandbox

### Prerequisites

- OpenClaw installed with NemoClaw plugin
- Node.js 18+ available inside the sandbox

### Steps

```bash
# 1. Create/enter your NemoClaw sandbox
openclaw nemoclaw setup

# 2. Install CipherClaw inside the sandbox
npm install cipherclaw

# 3. Use CipherClaw in your agent skills
# CipherClaw is now available as a standard Node.js module
```

### Usage Example (Inside Sandbox)

```typescript
import { createCipherClaw } from 'cipherclaw';

const cc = createCipherClaw();
const session = cc.startSession({ domain: 'agent' });

// Ingest traces from the agent run
cc.ingestTrace(agentTrace);

// Get root cause analysis
const graph = cc.getCausalGraph();
console.log('Root causes:', graph?.rootCauses);

// Predict failures
const predictions = cc.getPredictions();
for (const p of predictions) {
  console.log(`⚠️  ${p.predictedFailureType} (${(p.confidence * 100).toFixed(0)}% confidence)`);
}

// Generate full debug report
const report = cc.generateReport();
console.log(`Health score: ${report?.healthScore}/100`);
```

### Converting OpenTelemetry Traces

If your agents export traces via Opik or standard OTLP, use the built-in converter:

```typescript
import { convertOtlpTrace } from 'cipherclaw/engine';
import { createCipherClaw } from 'cipherclaw';

const cc = createCipherClaw();
cc.startSession({ domain: 'agent' });

// Convert OTLP spans to CipherClaw format
const ccTrace = convertOtlpTrace(otlpSpans, session.id);
cc.ingestTrace(ccTrace);
```

---

## What CipherClaw Does That NemoClaw Doesn't

NemoClaw answers: *"Is this agent allowed to do this?"*  
CipherClaw answers: *"Why did this agent fail, and what's about to break next?"*

| Capability | NemoClaw | CipherClaw |
|-----------|----------|------------|
| Sandbox isolation | ✅ | – |
| Network policy enforcement | ✅ | – |
| Filesystem access control | ✅ | – |
| Inference privacy routing | ✅ | – |
| Compliance audit trail | ✅ | – |
| **Causal root cause analysis** | – | ✅ |
| **Cognitive behavioral fingerprinting** | – | ✅ |
| **Predictive failure detection** | – | ✅ |
| **Soul/personality drift monitoring** | – | ✅ |
| **Multi-tier memory health analysis** | – | ✅ |
| **Cross-domain error correlation** | – | ✅ |
| **Automated flow test synthesis** | – | ✅ |

Together, they give enterprises both **security** (NemoClaw) and **observability** (CipherClaw) for production agent deployments.

---

## Audit Trail Integration

CipherClaw's event bus emits structured events for every debug action:

- `session-started` / `session-completed`
- `error-classified`
- `anomaly-detected` / `cascade-detected`
- `prediction-generated`
- `soul-drift-detected` / `cognitive-drift-detected`
- `breakpoint-hit`
- `trace-ingested`

These events can be forwarded to NemoClaw's audit trail system for unified compliance logging:

```typescript
const cc = createCipherClaw();

// Forward all CipherClaw events to your audit system
cc.onAny((event) => {
  auditTrail.log({
    source: 'cipherclaw',
    action: event.type,
    timestamp: event.timestamp,
    details: event.payload,
  });
});
```

---

## References

- [NemoClaw GitHub](https://github.com/NVIDIA/NemoClaw)
- [OpenClaw Documentation](https://docs.openclaw.com)
- [CipherClaw GitHub](https://github.com/Alexi5000/CipherClaw)
- [OpenShell Sandbox Specification](https://github.com/ArcadeAI/openshell)
