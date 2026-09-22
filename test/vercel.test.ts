import { describe, expect, it, vi } from 'vitest';
import { guardVercelTool } from '../src/adapters/vercel-ai.js';
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

describe('guardVercelTool', () => {
  it('runs execute when allowed and preserves other tool fields', async () => {
    const execute = vi.fn(async (input: Record<string, unknown>) => `ran:${String(input.path)}`);
    const tool = { description: 'list files', execute };
    const guarded = guardVercelTool('ls', tool, policy, provider({ destructive: { type: 'noul', noul: 0.05 } }));
    expect(guarded.description).toBe('list files');
    await expect(guarded.execute?.({ path: '.' })).resolves.toBe('ran:.');
    expect(execute).toHaveBeenCalledOnce();
  });

  it('blocks execute (throws, never runs it)', async () => {
    const execute = vi.fn(async (_input: Record<string, unknown>) => 'ran');
    const tool = { description: 'delete', execute };
    const guarded = guardVercelTool('rm', tool, policy, provider({ destructive: { type: 'noul', noul: 0.95 } }));
    await expect(guarded.execute?.({ path: '/' })).rejects.toBeInstanceOf(GuardBlockedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns the tool untouched when it has no execute', () => {
    const tool = { description: 'no-op' };
    const guarded = guardVercelTool('noop', tool, policy, provider({}));
    expect(guarded).toBe(tool);
  });
});
