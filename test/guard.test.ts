import { describe, expect, it, vi } from 'vitest';
import { guard } from '../src/guard.js';
import { noul, score } from '../src/policy.js';
import type { GuardPolicy } from '../src/policy.js';
import type { Answer, JevProvider } from '../src/providers/jev-provider.js';

const policy: GuardPolicy = {
  dimensions: {
    risk: score(['none', 'local', 'destructive', 'external'], 'blast radius'),
    destructive: noul('permanently deletes data?'),
  },
  decide: (r) => {
    const risk = typeof r.risk?.value === 'number' ? r.risk.value : 0;
    const destructive = typeof r.destructive?.value === 'number' ? r.destructive.value : 0;
    return risk >= 2 && destructive >= 0.8 ? 'block' : 'allow';
  },
  escalateBelow: 0.8,
  perTool: { read_file: 'allow' },
};

const providerReturning = (answers: Record<string, Answer>): JevProvider => ({
  evaluate: async () => ({ model: 'jev-test', answers, usage: { input_tokens: 10, output_tokens: 5 } }),
});

describe('guard', () => {
  it('short-circuits per-tool allowlisted calls without a Jev round-trip', async () => {
    const provider: JevProvider = {
      evaluate: async () => {
        throw new Error('provider should not be called for an allowlisted tool');
      },
    };
    const r = await guard({ tool: 'read_file', arguments: { path: 'a.txt' } }, policy, provider);
    expect(r.verdict).toBe('allow');
    expect(r.shortCircuited).toBe(true);
  });

  it('blocks a destructive call and invokes the audit sink', async () => {
    const provider = providerReturning({
      risk: { type: 'score', score: 3, confidence: 0.9, probabilities: {} },
      destructive: { type: 'noul', noul: 0.95 },
    });
    const audit = vi.fn();
    const r = await guard(
      { tool: 'bash', arguments: { cmd: 'rm -rf /data' }, task: 'clear the cache' },
      policy,
      provider,
      { audit },
    );
    expect(r.verdict).toBe('block');
    expect(r.shortCircuited).toBe(false);
    expect(r.usage?.input_tokens).toBe(10);
    expect(audit).toHaveBeenCalledOnce();
  });
});
