# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in CipherClaw, please report it responsibly.

**Do not open a public issue.** Instead, email security concerns to the maintainers through GitHub's private vulnerability reporting feature on this repository.

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Scope

CipherClaw is a debugging engine that processes execution traces and agent metadata. It does not:

- Make network requests
- Access file systems
- Execute arbitrary code
- Store credentials

The primary security concern is the handling of trace data, which may contain sensitive information from your agent system. CipherClaw processes all data in-memory and does not persist or transmit data externally.

## Dependencies

CipherClaw has zero runtime dependencies. This significantly reduces the attack surface compared to tools with large dependency trees.
