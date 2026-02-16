# Contributing to CipherClaw

Thanks for considering a contribution. CipherClaw is an open-source project and we welcome help from the community.

## Getting Started

```bash
git clone https://github.com/Alexi5000/CipherClaw.git
cd CipherClaw
pnpm install
pnpm test
```

All 154 tests should pass. If they don't, open an issue.

## What We're Looking For

**Bug fixes** — If you find something broken, fix it and send a PR. Include a test that would have caught it.

**New capabilities** — CipherClaw has 10 core debugging approaches. If you have an idea for an 11th, open a discussion first so we can talk about the design.

**Better tests** — More edge cases, more domains, more agent configurations. The test suite runs against the real engine with no mocks, and we want to keep it that way.

**Documentation** — If something is unclear, fix the docs. Clear writing is as valuable as clear code.

**OpenClaw integration** — Better event bus patterns, more skill manifest options, adapter improvements for different OpenClaw configurations.

## How to Submit

1. Fork the repo
2. Create a branch (`git checkout -b fix/your-fix` or `feat/your-feature`)
3. Make your changes
4. Run `pnpm test` — all 154 tests must pass
5. Run `pnpm typecheck` — zero errors in strict mode
6. Commit with a descriptive message
7. Push and open a PR

## Code Style

CipherClaw is written in TypeScript with strict mode enabled. A few guidelines:

- Zero `any` types in the public API. Internal use is acceptable when genuinely needed.
- Every public method should have a JSDoc comment.
- New capabilities need tests. Not "a test" — tests that cover the happy path, edge cases, and error conditions.
- No runtime dependencies. CipherClaw is zero-dependency by design.

## Architecture

When adding new capabilities:

1. **Types** go in `src/types/index.ts`
2. **Engine logic** goes in `src/core/engine.ts`
3. **OpenClaw tools** are registered in `src/openclaw/manifest.ts`
4. **Adapter methods** are added to `src/openclaw/adapter.ts`
5. **Exports** are added to `src/index.ts`

This follows the OpenClaw skill architecture. Keep things modular.

## Tests

The test suite has three layers:

| Suite | Purpose |
|-------|---------|
| `unit-core-capabilities.test.ts` | Tests each of the 10 core capabilities independently |
| `e2e-session-lifecycle.test.ts` | Tests full debug session flows across domains |
| `smoke-api.test.ts` | Tests every public API method and event |

Run them with `pnpm test`. They use Vitest and run against the real engine — no mocks, no stubs.

## Commit Messages

Use descriptive messages:

```
fix: handle empty span arrays in causal graph construction
feat: add memory capacity overflow detection to tier debugging
test: add edge case for single-span anomaly detection
docs: clarify soul integrity scoring algorithm
```

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

## Questions?

Open an issue or start a discussion. We're happy to help.
