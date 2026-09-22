import { describe, expect, it } from 'vitest';
import { enforce, GuardBlockedError } from '../src/enforce.js';
import type { GuardResult } from '../src/guard.js';
import type { ToolCall, Verdict } from '../src/policy.js';

const call: ToolCall = { tool: 'bash', arguments: { cmd: 'rm -rf /' } };
const res = (verdict: Verdict): GuardResult => ({ verdict, shortCircuited: false, readouts: {}, reasons: [] });

describe('enforce', () => {
  it('allows an `allow` verdict', async () => {
    await expect(enforce(call, res('allow'))).resolves.toBeUndefined();
  });

  it('throws GuardBlockedError on `block`', async () => {
    await expect(enforce(call, res('block'))).rejects.toBeInstanceOf(GuardBlockedError);
  });

  it('denies a `hold` with no handler (fail safe)', async () => {
    await expect(enforce(call, res('hold'))).rejects.toBeInstanceOf(GuardBlockedError);
  });

  it('lets an approved `hold` proceed', async () => {
    await expect(enforce(call, res('hold'), { onHold: async () => true })).resolves.toBeUndefined();
  });

  it('denies a `hold` the handler rejects', async () => {
    await expect(enforce(call, res('hold'), { onHold: async () => false })).rejects.toBeInstanceOf(GuardBlockedError);
  });

  it('observe mode lets everything run', async () => {
    await expect(enforce(call, res('block'), { mode: 'observe' })).resolves.toBeUndefined();
  });
});
