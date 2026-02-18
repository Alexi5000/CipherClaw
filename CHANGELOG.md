# Changelog

All notable changes to CipherClaw are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.3] — 2026-02-18

### Changed
- Elevated README to world-class open-source standard with banner, badges, and OpenClaw ecosystem branding
- Moved CI workflow from repo root to `.github/workflows/ci.yml` (GitHub Actions now auto-discovers it)
- Updated PR template test count from 154 to 206
- Updated CONTRIBUTING.md to reflect current code style guidelines
- Added `*.tsbuildinfo` and IDE files to `.gitignore`
- Consistent branding: "Clawli AI" and "OpenClaw Ecosystem" throughout

## [1.0.2] — 2026-02-16

### Changed
- Restructured skill folder to match OpenClaw conventions (SKILL.md + SOUL.md only)
- Added root `AGENTS.md` and `CLAUDE.md` symlink for agent coding assistants
- Rewrote SKILL.md with official ClawHub frontmatter format
- Rewrote SOUL.md to be concise and first-person
- Stripped verbose JSDoc to brief comments on non-obvious logic
- Cleaned up manifest description and version

## [1.0.1] — 2026-02-16

### Changed
- Decomposed monolithic engine into 17 focused modules under `src/core/`
- Engine is now a thin orchestrator that delegates to specialized modules

### Added
- `pauseSession` / `resumeSession` for session lifecycle control
- `getConfig` / `updateConfig` for runtime configuration
- `getStats` for aggregate session statistics
- `getRootCauses` for direct root cause access
- `getPredictions` for active prediction access
- `captureManualSnapshot` for on-demand state capture
- OpenClaw soul system files (SOUL.md, SKILL.md)

### Fixed
- Test suite expanded from 154 to 206 tests (66 unit, 65 e2e, 75 smoke)

## [1.0.0] — 2026-02-16

### Added
- Causal Debug Graph with root cause probability scoring
- Cognitive Fingerprinting across 8 behavioral dimensions
- Hierarchical Debug Propagation through agent command structures
- Multi-Tier Memory Debugging (working, short-term, episodic, semantic, archival)
- Predictive Failure Engine with 6 pattern recognizers
- Soul Integrity Monitoring with personality and value adherence scoring
- Cross-Domain Correlation across agent, CRM, content, and infrastructure domains
- Self-Debugging Agent Loop
- Flow Test Synthesis from observed execution traces
- Temporal Anomaly Cascade Detection
- 11 breakpoint types with state snapshot capture
- OpenClaw skill manifest, event bus adapter, and SKILL.md
- 154 tests — zero mocks, zero stubs

[1.0.3]: https://github.com/Alexi5000/CipherClaw/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Alexi5000/CipherClaw/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Alexi5000/CipherClaw/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Alexi5000/CipherClaw/releases/tag/v1.0.0
