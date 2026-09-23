import type { JevProvider } from './providers/jev-provider.js';
import type { GuardPolicy, Readout, ToolCall, Verdict } from './policy.js';
import { buildState } from './core/state.js';
import { buildQuestions } from './core/questions.js';
import { decide } from './core/decide.js';
import { keyOf, type GuardCache } from './cache.js';

export interface GuardResult {
  verdict: Verdict;
  /** true when a per-tool shortcut decided it without spending a Jev call. */
  shortCircuited: boolean;
  readouts: Record<string, Readout>;
  reasons: string[];
  usage?: { input_tokens: number; output_tokens: number };
  /** true when this verdict was served from the cache rather than a fresh Jev call. */
  fromCache?: boolean;
}

export interface GuardOptions {
  /**
   * Mandatory-by-convention audit sink: Jev returns no rationale, so every verdict
   * (plus its inputs and probabilities) should be logged for post-hoc review.
   */
  audit?: (entry: GuardResult & { call: ToolCall }) => void;
  /** memoize verdicts for identical tool calls to skip repeat Jev round-trips (see `createCache`). */
  cache?: GuardCache;
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

  const cacheKey = opts.cache ? keyOf(call) : undefined;
  if (opts.cache && cacheKey !== undefined) {
    const cached = opts.cache.get(cacheKey);
    if (cached) {
      const hit: GuardResult = { ...cached, fromCache: true };
      opts.audit?.({ ...hit, call });
      return hit;
    }
  }

  const { answers, usage } = await provider.evaluate({
    state: buildState(call),
    questions: buildQuestions(policy),
  });
  const { verdict, readouts, reasons } = decide(answers, policy);
  const result: GuardResult = { verdict, shortCircuited: false, readouts, reasons, ...(usage ? { usage } : {}) };
  if (opts.cache && cacheKey !== undefined) opts.cache.set(cacheKey, result);
  opts.audit?.({ ...result, call });
  return result;
}
