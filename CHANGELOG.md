# Changelog

All notable changes to CipherClaw are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.1] — 2026-02-16

### Refactored
- Decomposed monolithic engine into 17 focused modules under `src/core/`
- Engine is now a thin orchestrator (378 lines) that delegates to specialized modules
- Each capability (causal graph, cognitive profiler, memory debugger, etc.) lives in its own file

### Added — OpenClaw Soul System
- `SOUL.md` — Phantom agent personality, core truths, boundaries, and vibe
- `IDENTITY.md` — Agent identity with sub-agent roster
- `AGENTS.md` — Operating instructions, memory management, event bus rules
- Enhanced `SKILL.md` with `metadata.openclaw` gating and operational instructions

### Added — Engine Methods
- `pauseSession` / `resumeSession` for session lifecycle control
- `getConfig` / `updateConfig` for runtime configuration
- `getStats` for aggregate session statistics
- `getRootCauses` for direct root cause access
- `computeCognitiveFingerprint` / `getCognitiveFingerprint` split
- `getPredictions` for active prediction access
- `captureManualSnapshot` for on-demand state capture

### Improved
- JSDoc documentation on every public engine method
- Test suite expanded from 154 to 206 tests (66 unit, 65 end-to-end, 75 smoke)
- All documentation updated to reflect modular architecture
- Build produces both ESM and CJS with correct module resolution

## [1.0.0] — 2026-02-16

### Core Engine

- Causal Debug Graph construction with root cause probability scoring
- Cognitive Fingerprinting across 8 behavioral dimensions with drift detection
- Hierarchical Debug Propagation (up, down, lateral) through agent command structures
- Multi-Tier Memory Debugging across working, short-term, episodic, semantic, and archival tiers
- Predictive Failure Engine with 6 pattern recognizers
- Soul Integrity Monitoring with personality, value, and style adherence scoring
- Cross-Domain Correlation across agent, CRM, content, and infrastructure domains
- Self-Debugging Agent Loop with automated self-repair
- Flow Test Synthesis from observed execution traces, plus 8 built-in flow tests
- Temporal Anomaly Cascade Detection with configurable time windows
- 11 breakpoint types with state snapshot capture
- Time-travel replay across state snapshots
- Error classification matrix with severity scoring and fix suggestions

### OpenClaw Integration

- Standard SKILL.md for OpenClaw skill registry
- Event bus adapter with 12 event types
- Skill manifest with 5 agents, 10 skills, 14 tools
- Plug-and-play compatibility with any OpenClaw system

### Test Suite

- 154 tests (66 unit, 13 end-to-end, 75 smoke) — initial release
- Zero mocks, zero stubs — all tests run against the real engine

### Documentation

- Architecture specification
- Innovation documentation for all 10 approaches
- 4 architecture diagrams
- Contributing guidelines, security policy, code of conduct
- CI pipeline for Node 18, 20, 22

[1.0.1]: https://github.com/Alexi5000/CipherClaw/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Alexi5000/CipherClaw/releases/tag/v1.0.0
