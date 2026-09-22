import type { Answer } from './providers/jev-provider.js';

/** A proposed tool call to vet before execution. */
export interface ToolCall {
  tool: string;
  arguments: Record<string, unknown>;
  /** optional: the task the agent is pursuing, so the guard can spot off-task actions. */
  task?: string;
}

export type Verdict = 'allow' | 'block' | 'hold';

/** A risk dimension — one Jev question the guard asks about the tool call. */
export type Dimension =
  | { kind: 'score'; instructions: string; levels: string[] }
  | { kind: 'noul'; instructions: string }
  | { kind: 'choice'; instructions: string; options: Record<string, string> };

/** Declare an ordered-severity dimension. Phrase so the risky case is the HIGH level. */
export const score = (levels: string[], instructions: string): Dimension => ({ kind: 'score', instructions, levels });
/** Declare a yes/no dimension. Phrase so the risky case is `true` (Jev reads negations literally). */
export const noul = (instructions: string): Dimension => ({ kind: 'noul', instructions });
/** Declare a pick-one dimension. */
export const choice = (options: Record<string, string>, instructions: string): Dimension => ({
  kind: 'choice',
  instructions,
  options,
});

/** What the policy's `decide` sees for each dimension. */
export interface Readout {
  /** noul → yes-probability [0,1]; score → numeric score; choice → chosen label. */
  value: number | string;
  /** score/choice → calibrated confidence [0,1]; noul → 1 (noul is gated by its own probability). */
  confidence: number;
  /** the raw typed answer, for the audit trail. */
  raw: Answer;
}

export interface GuardPolicy {
  /** the risk questions, asked in one batched Jev call (adding dimensions is near-free). */
  dimensions: Record<string, Dimension>;
  /** pure verdict from the readouts — your risk logic, as typed code (not a string DSL). */
  decide: (readouts: Record<string, Readout>) => Verdict;
  /** confidence floor: an `allow` leaning on a below-floor score/choice answer fails safe to `hold`. */
  escalateBelow?: number;
  /** per-tool shortcut evaluated BEFORE any Jev call — e.g. `{ read_file: 'allow' }` to bypass cheap tools. */
  perTool?: Record<string, Verdict>;
}
