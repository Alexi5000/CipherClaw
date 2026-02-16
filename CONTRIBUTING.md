# Contributing to CipherClaw

Thank you for your interest in contributing to CipherClaw — the world's first OpenClaw Bug Hunter AI Agent!

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/Alexi5000/CipherClaw/issues) to avoid duplicates.
2. Create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details (Node version, OS, etc.)

### Suggesting Features

1. Open a [feature request issue](https://github.com/Alexi5000/CipherClaw/issues/new).
2. Describe the feature and its use case.
3. Explain how it fits within the CipherClaw architecture.

### Submitting Code

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the coding standards below.
4. Write tests for new functionality.
5. Ensure all tests pass: `pnpm test`
6. Ensure type checking passes: `pnpm typecheck`
7. Commit with a descriptive message: `git commit -m "feat: add new capability"`
8. Push and create a Pull Request.

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Style:** Follow existing code patterns in `src/core/engine.ts`
- **Naming:** Use camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE_CASE for constants
- **Comments:** Use JSDoc for all public exports
- **Tests:** Write tests for all new functionality

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `test:` — Adding or updating tests
- `refactor:` — Code refactoring
- `perf:` — Performance improvements

## Architecture Guidelines

CipherClaw follows the OpenClaw architecture. When adding new capabilities:

1. **Types** go in `src/types/index.ts`
2. **Engine logic** goes in `src/core/engine.ts`
3. **OpenClaw tools** are registered in `src/openclaw/manifest.ts`
4. **Adapter methods** are added to `src/openclaw/adapter.ts`
5. **Exports** are added to `src/index.ts`

## Patent Considerations

CipherClaw contains patent-pending technology. If your contribution introduces a novel capability, please note this in your PR description so we can evaluate it for inclusion in the patent portfolio.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for helping make CipherClaw the best debug agent in the world!
