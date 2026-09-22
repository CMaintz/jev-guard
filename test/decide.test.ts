import { describe, expect, it } from 'vitest';
import { decide } from '../src/core/decide.js';
import { noul, score } from '../src/policy.js';
import type { GuardPolicy } from '../src/policy.js';
import type { Answer } from '../src/providers/jev-provider.js';

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
};

describe('decide', () => {
  it('blocks a confident high-risk destructive call', () => {
    const answers: Record<string, Answer> = {
      risk: { type: 'score', score: 2.9, confidence: 0.9, probabilities: {} },
      destructive: { type: 'noul', noul: 0.94 },
    };
    expect(decide(answers, policy).verdict).toBe('block');
  });

  it('allows a confident safe call', () => {
    const answers: Record<string, Answer> = {
      risk: { type: 'score', score: 0.2, confidence: 0.95, probabilities: {} },
      destructive: { type: 'noul', noul: 0.02 },
    };
    expect(decide(answers, policy).verdict).toBe('allow');
  });

  it('fails safe: an allow leaning on a low-confidence risk score becomes hold', () => {
    const answers: Record<string, Answer> = {
      risk: { type: 'score', score: 0.2, confidence: 0.4, probabilities: {} },
      destructive: { type: 'noul', noul: 0.02 },
    };
    const d = decide(answers, policy);
    expect(d.verdict).toBe('hold');
    expect(d.reasons.join(' ')).toMatch(/fail-safe/);
  });
});
