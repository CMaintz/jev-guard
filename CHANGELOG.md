# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- v0.1 core: framework-agnostic `guard(toolCall, policy, provider) → Verdict` (`allow` / `block` / `hold`).
- Pure, testable modules: `buildState`, `buildQuestions`, `decide` (fail-safe verdict wrapper).
- Typed policy API: `score` / `noul` / `choice` dimension helpers; a `decide` callback (typed code, not a string DSL); `escalateBelow` confidence floor; `perTool` shortcut to bypass cheap tools.
- Shared `JevProvider` port (TypeSafe + Cloudflare adapters, `postJson` backoff) reused from jev-triage; wire shape verified against docs.typesafe.ai/api.
- Onboarded onto the Foundry gate (mise six-verb interface, reusable CI workflows @v1.2.0).

### Verified
- `mise run gate` (lint → typecheck → test → audit) passes locally.

### TODO before v0.1.0
- LangChain (JS) middleware adapter + Vercel AI SDK adapter (`wrapTool`).
- Exercise end-to-end against a live Jev key.
- `observe` mode + policy presets (shell / SQL / filesystem / payments).
