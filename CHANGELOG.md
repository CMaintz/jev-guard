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
  execute function; a blocked call throws before the tool runs. LangChain/Vercel
  adapters will be thin specializations of this.

### Verified

- `mise run gate` (lint → typecheck → test → audit) passes locally; 14 unit tests.

### TODO before v0.1.0

- Dedicated LangChain (JS) middleware + Vercel AI SDK adapters (thin over `wrapTool`) —
  pending confirmation of each framework's current tool-interception API.
- LangChain Python parity.
- Exercise end-to-end against a live Jev key.
- Policy presets (shell / SQL / filesystem / payments).
