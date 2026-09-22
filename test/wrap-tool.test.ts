import { describe, expect, it, vi } from 'vitest';
import { wrapTool } from '../src/adapters/wrap-tool.js';
import { GuardBlockedError } from '../src/enforce.js';
import { noul } from '../src/policy.js';
import type { GuardPolicy } from '../src/policy.js';
import type { Answer, JevProvider } from '../src/providers/jev-provider.js';

const policy: GuardPolicy = {
  dimensions: { destructive: noul('permanently deletes data?') },
  decide: (r) => (Number(r.destructive?.value) >= 0.8 ? 'block' : 'allow'),
};

const provider = (answers: Record<string, Answer>): JevProvider => ({
  evaluate: async () => ({ model: 'jev-test', answers }),
});

describe('wrapTool', () => {
  it('runs the wrapped tool when the guard allows it', async () => {
    const exec = vi.fn(async (a: { x: number }) => a.x + 1);
    const guarded = wrapTool('add', exec, policy, provider({ destructive: { type: 'noul', noul: 0.01 } }));
    await expect(guarded({ x: 1 })).resolves.toBe(2);
    expect(exec).toHaveBeenCalledOnce();
  });

  it('blocks a destructive call and never runs the tool', async () => {
    const exec = vi.fn(async (_a: Record<string, unknown>) => 'ran');
    const guarded = wrapTool('rm', exec, policy, provider({ destructive: { type: 'noul', noul: 0.95 } }));
    await expect(guarded({ path: '/' })).rejects.toBeInstanceOf(GuardBlockedError);
    expect(exec).not.toHaveBeenCalled();
  });
});
