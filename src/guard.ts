import type { JevProvider } from './providers/jev-provider.js';
import type { GuardPolicy, Readout, ToolCall, Verdict } from './policy.js';
import { buildState } from './core/state.js';
import { buildQuestions } from './core/questions.js';
import { decide } from './core/decide.js';

export interface GuardResult {
  verdict: Verdict;
  /** true when a per-tool shortcut decided it without spending a Jev call. */
  shortCircuited: boolean;
  readouts: Record<string, Readout>;
  reasons: string[];
  usage?: { input_tokens: number; output_tokens: number };
}

export interface GuardOptions {
  /**
   * Mandatory-by-convention audit sink: Jev returns no rationale, so every verdict
   * (plus its inputs and probabilities) should be logged for post-hoc review.
   */
  audit?: (entry: GuardResult & { call: ToolCall }) => void;
}

/**
 * Vet a single proposed tool call and return a verdict. Framework-agnostic core —
 * the LangChain / Vercel AI SDK adapters (v0.2+) are thin wrappers over this.
 *
 * v0.1 is "observe-friendly": it returns the verdict; the caller decides whether to
 * enforce (block/hold) or merely log. Adapters add automatic enforcement.
 */
export async function guard(
  call: ToolCall,
  policy: GuardPolicy,
  provider: JevProvider,
  opts: GuardOptions = {},
): Promise<GuardResult> {
  const forced = policy.perTool?.[call.tool];
  if (forced) {
    const result: GuardResult = {
      verdict: forced,
      shortCircuited: true,
      readouts: {},
      reasons: [`perTool: ${call.tool} → ${forced}`],
    };
    opts.audit?.({ ...result, call });
    return result;
  }

  const { answers, usage } = await provider.evaluate({
    state: buildState(call),
    questions: buildQuestions(policy),
  });
  const { verdict, readouts, reasons } = decide(answers, policy);
  const result: GuardResult = { verdict, shortCircuited: false, readouts, reasons, ...(usage ? { usage } : {}) };
  opts.audit?.({ ...result, call });
  return result;
}
