# CipherClaw Agent Instructions

Repo: https://github.com/Alexi5000/CipherClaw

## Project Structure

Source code: `src/core/` (modular engine), `src/openclaw/` (adapter + manifest), `src/types/` (type definitions).
Tests: colocated `*.test.ts` next to source in `src/core/`.
Skill files: `skills/cipherclaw/SKILL.md` (operational instructions), `skills/cipherclaw/SOUL.md` (agent personality).
Built output: `dist/` (ESM + CJS).

## Build, Test, and Development Commands

Install deps: `pnpm install`
Type-check: `pnpm build` (runs tsc for both ESM and CJS targets)
Tests: `pnpm test` (vitest)
Single test file: `npx vitest run src/core/engine.test.ts`

## Coding Style

Language: TypeScript (ESM). Strict typing; no `any`.
Keep files under ~700 LOC. Split when it improves clarity.
Brief code comments for tricky or non-obvious logic only.
Commit messages: concise, action-oriented (e.g., `core: add snapshot diffing`).

## Architecture

CipherClaw is a zero-dependency AI agent debugging toolkit. The engine (`src/core/engine.ts`) is a thin orchestrator that composes pure functions from focused modules:

- `anomaly-detector.ts` — statistical anomaly detection with z-score thresholds
- `breakpoints.ts` — conditional breakpoint evaluation
- `causal-graph.ts` — directed acyclic graph construction for root cause analysis
- `cognitive-profiler.ts` — decision pattern fingerprinting
- `cross-domain.ts` — multi-domain event correlation
- `error-classifier.ts` — error categorization with severity scoring
- `flow-runner.ts` — debug flow execution
- `flow-tests.ts` — automated flow test synthesis
- `hierarchy-propagation.ts` — parent-child debug event propagation
- `memory-debugger.ts` — tiered memory health analysis
- `predictive-engine.ts` — failure prediction from historical patterns
- `report-generator.ts` — structured debug report generation
- `self-debug.ts` — recursive self-analysis
- `snapshots.ts` — session state capture and diffing
- `soul-monitor.ts` — behavioral drift detection against soul definitions

Each module exports pure functions. No side effects. No shared mutable state.

## OpenClaw Integration

The adapter (`src/openclaw/adapter.ts`) wraps the engine for OpenClaw's plugin interface. The manifest (`src/openclaw/manifest.ts`) declares capabilities for the skill registry.

## Security

No secrets in code, tests, or docs. All test data uses obviously fake values.
No network calls. No filesystem access. Pure computation only.
