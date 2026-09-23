# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- v0.1 core: framework-agnostic `guard(toolCall, policy, provider) → Verdict` (`allow` / `block` / `hold`).
- Pure, testable modules: `buildState`, `buildQuestions`, `decide` (fail-safe verdict wrapper).
- Typed policy API: `score` / `noul` / `choice` dimension helpers; a `decide` callback (typed code, not a string DSL); `escalateBelow` confidence floor; `perTool` shortcut to bypass cheap tools.
- Shared `JevProvider` port (TypeSafe + Cloudflare adapters, `postJson` backoff) reused from jev-triage; wire shape verified against docs.typesafe.ai/api.
- Onboarded onto the Foundry gate (mise six-verb interface, reusable CI workflows @v1.2.0).
- **v0.2 enforcement layer:** `enforce(call, result)` maps a verdict to an action —
  `allow` proceeds, `block` throws `GuardBlockedError`, `hold` asks an `onHold`
  human-in-the-loop handler (fail-safe: denies without one). `observe` mode logs
  without enforcing.
- **v0.2 `wrapTool()`** — framework-agnostic HOF that guards + enforces any tool's
  execute function; a blocked call throws before the tool runs.
- **v0.2 framework adapters** (dependency-free, structural types, subpath exports):
  - `jev-guard/langchain` — `jevGuardMiddleware()` for LangChain JS's `wrapToolCall` hook.
  - `jev-guard/vercel` — `guardVercelTool()` wraps a Vercel AI SDK tool's `execute`,
    preserving `description`/`inputSchema`.
- **v0.2 policy presets** — `shellPolicy` / `filesystemPolicy` / `sqlPolicy` / `paymentsPolicy`:
  ready-made policies for the common dangerous tool classes (spread to customize).

### Verified

- `mise run gate` (lint → typecheck → test → audit) passes locally; 23 unit tests.
- Adapter APIs confirmed against current LangChain JS (`createMiddleware`/`wrapToolCall`)
  and Vercel AI SDK (`tool({ execute })`) docs — not guessed.
- **Live-validated against the real Jev API** (`examples/smoke.mjs`): `rm -rf` → block
  (destructive 0.97), `ls` → allow; ~360–500 ms/call. Wire shape + full pipeline confirmed.

### TODO before v0.1.0

- LangChain Python parity.
- README demo (GIF of an agent's `rm -rf` getting blocked mid-loop).
- npm publish.
