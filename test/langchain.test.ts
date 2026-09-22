import { describe, expect, it, vi } from 'vitest';
import { jevGuardMiddleware } from '../src/adapters/langchain.js';
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

describe('jevGuardMiddleware (LangChain)', () => {
  it('calls the real handler when the call is allowed', async () => {
    const mw = jevGuardMiddleware(policy, provider({ destructive: { type: 'noul', noul: 0.1 } }));
    const handler = vi.fn(async () => 'tool ran');
    const req = { toolCall: { name: 'ls', args: { path: '.' }, id: '1' } };
    await expect(mw.wrapToolCall(req, handler)).resolves.toBe('tool ran');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('blocks (throws) and never calls the handler', async () => {
    const mw = jevGuardMiddleware(policy, provider({ destructive: { type: 'noul', noul: 0.97 } }));
    const handler = vi.fn(async () => 'tool ran');
    const req = { toolCall: { name: 'rm', args: { path: '/' }, id: '2' } };
    await expect(mw.wrapToolCall(req, handler)).rejects.toBeInstanceOf(GuardBlockedError);
    expect(handler).not.toHaveBeenCalled();
  });
});
