# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- LangChain **Python** parity (a PyPI package mirroring the core).

## [1.0.0] - 2026-09-23

First stable release — a framework-agnostic LLM tool-call guardrail powered by TypeSafe AI's Jev.

### Added

- **Core:** framework-agnostic `guard(toolCall, policy, provider) → Verdict` (`allow` / `block` / `hold`)
  over pure, testable modules (`buildState`, `buildQuestions`, `decide` with a fail-safe wrapper).
- **Typed policy API:** `score` / `noul` / `choice` helpers; a typed `decide` callback (no string DSL);
  `escalateBelow` confidence floor; `perTool` bypass.
- **Enforcement:** `enforce(call, result)` — `allow` proceeds, `block` throws `GuardBlockedError`,
  `hold` asks an `onHold` handler (fail-safe: denies without one); `observe` mode; framework-agnostic `wrapTool()`.
- **Framework adapters** (dependency-free, subpath exports): `jev-guard/langchain`
  (`jevGuardMiddleware` for LangChain JS's `wrapToolCall`) and `jev-guard/vercel`
  (`guardVercelTool` wrapping a Vercel AI SDK tool's `execute`).
- **Policy presets:** `shellPolicy` / `filesystemPolicy` / `sqlPolicy` / `paymentsPolicy`.
- **Verdict caching:** `createCache({ ttlMs, max })` — identical repeat calls skip the Jev round-trip (`fromCache`).
- **Shared `JevProvider` port** (TypeSafe + Cloudflare, `postJson` backoff); animated README demo;
  onboarded onto the Foundry gate.

### Verified

- `mise run gate` (lint → typecheck → test → audit) green; 29 unit tests.
- Adapter APIs confirmed against current LangChain JS + Vercel AI SDK docs — not guessed.
- **Live-validated against the real Jev API:** `rm -rf` → block (destructive 0.97), `ls` → allow;
  ~360–500 ms/call. Wire shape + full pipeline confirmed end-to-end.
