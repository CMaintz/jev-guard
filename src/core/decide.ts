import type { Answer } from '../providers/jev-provider.js';
import type { GuardPolicy, Readout, Verdict } from '../policy.js';

export interface Decision {
  verdict: Verdict;
  readouts: Record<string, Readout>;
  reasons: string[];
}

/**
 * Turn Jev's answers into readouts, run the policy, then apply the fail-safe.
 * Pure — no I/O. This is the inverse of jev-triage's gate: here uncertainty must
 * never resolve to `allow`.
 */
export function decide(answers: Record<string, Answer>, policy: GuardPolicy): Decision {
  const readouts = toReadouts(answers, policy);
  const reasons: string[] = [];
  let verdict = policy.decide(readouts);

  // Fail-safe: never `allow` while a gated (score/choice) risk dimension is below
  // the confidence floor. Low confidence on a risk question is itself a risk.
  if (verdict === 'allow' && policy.escalateBelow != null) {
    for (const [key, r] of Object.entries(readouts)) {
      const dim = policy.dimensions[key];
      if (dim && dim.kind !== 'noul' && r.confidence < policy.escalateBelow) {
        verdict = 'hold';
        reasons.push(`${key}: confidence ${r.confidence.toFixed(2)} < ${policy.escalateBelow} → fail-safe hold`);
      }
    }
  }

  return { verdict, readouts, reasons };
}

function toReadouts(answers: Record<string, Answer>, policy: GuardPolicy): Record<string, Readout> {
  const out: Record<string, Readout> = {};
  for (const key of Object.keys(policy.dimensions)) {
    const a = answers[key];
    if (!a) continue;
    if (a.type === 'noul') {
      out[key] = { value: a.noul, confidence: 1, raw: a };
    } else if (a.type === 'score') {
      out[key] = { value: a.score, confidence: a.confidence, raw: a };
    } else {
      out[key] = { value: a.choice, confidence: a.confidence, raw: a };
    }
  }
  return out;
}
