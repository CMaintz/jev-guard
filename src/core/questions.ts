import type { GuardPolicy } from '../policy.js';
import type { Question } from '../providers/jev-provider.js';

/** Translate policy dimensions into one batched set of Jev questions. Pure. */
export function buildQuestions(policy: GuardPolicy): Record<string, Question> {
  const questions: Record<string, Question> = {};
  for (const [key, dim] of Object.entries(policy.dimensions)) {
    if (dim.kind === 'score') {
      questions[key] = { type: 'score', instructions: dim.instructions, criteria: dim.levels };
    } else if (dim.kind === 'noul') {
      questions[key] = { type: 'noul', instructions: dim.instructions };
    } else {
      questions[key] = { type: 'choice', instructions: dim.instructions, criteria: dim.options };
    }
  }
  return questions;
}
