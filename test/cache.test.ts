import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCache, keyOf } from '../src/cache.js';
import { guard, type GuardResult } from '../src/guard.js';
import { noul, type GuardPolicy, type Verdict } from '../src/policy.js';
import type { Answer, JevProvider } from '../src/providers/jev-provider.js';

const mk = (verdict: Verdict = 'allow'): GuardResult => ({ verdict, shortCircuited: false, readouts: {}, reasons: [] });

describe('keyOf', () => {
  it('is stable regardless of argument key order', () => {
    expect(keyOf({ tool: 'x', arguments: { a: 1, b: 2 } })).toBe(keyOf({ tool: 'x', arguments: { b: 2, a: 1 } }));
  });

  it('differs by tool, args, and task', () => {
    expect(keyOf({ tool: 'x', arguments: { a: 1 } })).not.toBe(keyOf({ tool: 'y', arguments: { a: 1 } }));
    expect(keyOf({ tool: 'x', arguments: { a: 1 } })).not.toBe(keyOf({ tool: 'x', arguments: { a: 2 } }));
    expect(keyOf({ tool: 'x', arguments: {}, task: 't1' })).not.toBe(keyOf({ tool: 'x', arguments: {}, task: 't2' }));
  });
});

describe('createCache', () => {
  afterEach(() => vi.useRealTimers());

  it('stores and returns a value; misses are undefined', () => {
    const c = createCache();
    c.set('k', mk());
    expect(c.get('k')?.verdict).toBe('allow');
    expect(c.get('missing')).toBeUndefined();
  });

  it('expires entries after the TTL', () => {
    vi.useFakeTimers();
    const c = createCache({ ttlMs: 1000 });
    c.set('k', mk());
    expect(c.get('k')).toBeDefined();
    vi.advanceTimersByTime(1001);
    expect(c.get('k')).toBeUndefined();
  });

  it('evicts the oldest entry when over the max size', () => {
    const c = createCache({ max: 2 });
    c.set('a', mk());
    c.set('b', mk());
    c.set('c', mk());
    expect(c.get('a')).toBeUndefined();
    expect(c.get('c')).toBeDefined();
  });
});

describe('guard with cache', () => {
  it('serves identical repeat calls from cache without a second Jev call', async () => {
    let calls = 0;
    const provider: JevProvider = {
      evaluate: async () => {
        calls++;
        return { model: 't', answers: { d: { type: 'noul' as const, noul: 0.1 } satisfies Answer } };
      },
    };
    const policy: GuardPolicy = { dimensions: { d: noul('x') }, decide: () => 'allow' };
    const cache = createCache();
    const call = { tool: 'ls', arguments: { path: '.' } };

    const first = await guard(call, policy, provider, { cache });
    const second = await guard(call, policy, provider, { cache });

    expect(calls).toBe(1);
    expect(first.fromCache).toBeUndefined();
    expect(second.fromCache).toBe(true);
    expect(second.verdict).toBe('allow');
  });
});
