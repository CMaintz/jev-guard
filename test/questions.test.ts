import { describe, expect, it } from 'vitest';
import { buildQuestions } from '../src/core/questions.js';
import { choice, noul, score } from '../src/policy.js';
import type { GuardPolicy } from '../src/policy.js';

const policy: GuardPolicy = {
  dimensions: {
    risk: score(['none', 'local', 'destructive', 'external'], 'blast radius'),
    destructive: noul('permanently deletes data?'),
    kind: choice({ read: 'reads', write: 'writes' }, 'read or write?'),
  },
  decide: () => 'allow',
};

describe('buildQuestions', () => {
  it('maps each dimension kind to the matching Jev primitive', () => {
    const q = buildQuestions(policy);
    expect(q.risk).toMatchObject({ type: 'score', criteria: ['none', 'local', 'destructive', 'external'] });
    expect(q.destructive).toEqual({ type: 'noul', instructions: 'permanently deletes data?' });
    expect(q.kind).toMatchObject({ type: 'choice', criteria: { read: 'reads', write: 'writes' } });
  });
});
