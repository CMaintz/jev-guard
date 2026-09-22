import { describe, expect, it } from 'vitest';
import { filesystemPolicy, paymentsPolicy, shellPolicy, sqlPolicy } from '../src/presets.js';
import type { Readout } from '../src/policy.js';

const ro = (value: number): Readout => ({ value, confidence: 1, raw: { type: 'noul', noul: value } });
const str = (value: string): Readout => ({
  value,
  confidence: 1,
  raw: { type: 'choice', choice: value, confidence: 1, probabilities: {} },
});

describe('presets', () => {
  it('shellPolicy: block destructive+risky, hold exfiltration or high risk, else allow', () => {
    const p = shellPolicy();
    expect(p.decide({ risk: ro(3), destructive: ro(0.9), exfiltrates: ro(0) })).toBe('block');
    expect(p.decide({ risk: ro(1), destructive: ro(0.1), exfiltrates: ro(0.9) })).toBe('hold');
    expect(p.decide({ risk: ro(3), destructive: ro(0.1), exfiltrates: ro(0.1) })).toBe('hold');
    expect(p.decide({ risk: ro(0), destructive: ro(0.1), exfiltrates: ro(0.1) })).toBe('allow');
    // a non-numeric readout (e.g. a choice) reads as 0 risk → allow, not a crash
    expect(p.decide({ risk: str('none'), destructive: ro(0.1), exfiltrates: ro(0.1) })).toBe('allow');
  });

  it('filesystemPolicy: block destructive+outside, hold destructive OR outside, else allow', () => {
    const p = filesystemPolicy();
    expect(p.decide({ destructive: ro(0.9), outsideWorkspace: ro(0.9) })).toBe('block');
    expect(p.decide({ destructive: ro(0.9), outsideWorkspace: ro(0.1) })).toBe('hold');
    expect(p.decide({ destructive: ro(0.1), outsideWorkspace: ro(0.9) })).toBe('hold');
    expect(p.decide({ destructive: ro(0.1), outsideWorkspace: ro(0.1) })).toBe('allow');
  });

  it('sqlPolicy: block unscoped, hold mutating, allow reads', () => {
    const p = sqlPolicy();
    expect(p.decide({ mutating: ro(1), unscoped: ro(0.9) })).toBe('block');
    expect(p.decide({ mutating: ro(0.9), unscoped: ro(0.1) })).toBe('hold');
    expect(p.decide({ mutating: ro(0.1), unscoped: ro(0) })).toBe('allow');
  });

  it('paymentsPolicy: hold any money movement, else allow', () => {
    const p = paymentsPolicy();
    expect(p.decide({ movesMoney: ro(0.6), irreversible: ro(0.9) })).toBe('hold');
    expect(p.decide({ movesMoney: ro(0.1), irreversible: ro(0) })).toBe('allow');
  });
});
