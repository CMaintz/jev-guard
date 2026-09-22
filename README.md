# jev-guard

**A guardrail that vets an LLM agent's tool calls through [TypeSafe AI's Jev](https://typesafe.ai/) before they run** — so an autonomous agent can't `rm -rf` your box on a bad hunch.

Every proposed tool call goes through one near-free Jev check (~70–500 ms) that returns typed risk decisions + calibrated confidence. Safe calls **allow**, clearly destructive ones **block**, uncertain ones **hold** for a human. Because Jev is ~free, you can afford to guard *every* call — and because it's confidence-aware, uncertainty **fails safe**.

```ts
import { guard, score, noul, TypeSafeProvider } from 'jev-guard';

const provider = new TypeSafeProvider(process.env.JEV_API_KEY!);

const policy = {
  dimensions: {
    risk: score(['none', 'local-reversible', 'local-destructive', 'external-or-irreversible'],
                'Blast radius if this runs unintended'),
    destructive: noul('Does this permanently delete or overwrite data?'),
    exfiltrates: noul('Does this send secrets to an external destination?'),
  },
  decide: (r) => {
    if (Number(r.risk?.value) >= 2 && Number(r.destructive?.value) >= 0.8) return 'block';
    if (Number(r.exfiltrates?.value) >= 0.7) return 'hold';
    return 'allow';
  },
  escalateBelow: 0.8,               // low confidence on a risk dimension → fail safe (hold)
  perTool: { read_file: 'allow' },  // cheap tools bypass the round-trip
};

const { verdict } = await guard(
  { tool: 'bash', arguments: { cmd: 'rm -rf /var/lib/postgresql/data' }, task: 'Clear the build cache' },
  policy, provider, { audit: (e) => console.log(e) },
);
// → 'block'
```

## Why Jev (not a regex denylist or a second LLM)

A denylist can't tell "delete the temp cache" from "delete prod". A second LLM is slow, costly, and hands you prose to parse. Jev is a semantic check that's cheap enough to run on every call and returns a *typed value you branch on* plus a *confidence you gate on*.

## Status

**v0.1 scaffold** — the framework-agnostic `guard()` + pure, tested core (`buildState` / `buildQuestions` / `decide`) + the shared provider port (verified against [docs.typesafe.ai/api](https://docs.typesafe.ai/api)). Passes the [Foundry](https://github.com/CMaintz/foundry) gate. LangChain & Vercel AI SDK adapters are next (v0.2). Not yet exercised against a live key. See the [full spec](../SPECS/jev-guard.md).

## Honest limitations

- **NOT a security boundary.** ~68% accuracy and a probabilistic model mean a determined prompt-injection can slip through. Keep real sandboxing, least-privilege creds, and allowlists — jev-guard is a cheap semantic layer *on top*, not a replacement.
- **Latency in the hot path.** It adds one round-trip before each guarded call. Mitigate: allowlist cheap tools (`perTool`), and all risk dimensions ride one batched call.
- **No rationale.** Jev returns numbers, not "why" — the `audit` sink is mandatory, and a `hold` should surface the inputs to the human.
- **Text-only / no counting** — keep quantitative limits ("delete > N rows") in code.

## Development

Quality is enforced through [Foundry](https://github.com/CMaintz/foundry)'s six-verb gate:

```bash
mise run gate   # lint → typecheck → test (coverage floor) → audit
npm run build   # tsc → dist/ (ESM + d.ts) for publishing
```

MIT © Christoffer Maintz
