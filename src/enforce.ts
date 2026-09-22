import type { GuardResult } from './guard.js';
import type { ToolCall } from './policy.js';

/** Thrown when the guard blocks a tool call (a `block`, or a `hold` the human denied). */
export class GuardBlockedError extends Error {
  readonly call: ToolCall;
  readonly result: GuardResult;

  constructor(call: ToolCall, result: GuardResult) {
    super(`jev-guard ${result.verdict === 'block' ? 'blocked' : 'held'} tool "${call.tool}"`);
    this.name = 'GuardBlockedError';
    this.call = call;
    this.result = result;
  }
}

export interface EnforceOptions {
  /** 'enforce' (default) acts on the verdict; 'observe' lets everything run (log-only). */
  mode?: 'enforce' | 'observe';
  /**
   * Called on a `hold`. Return true to let the call proceed, false to deny.
   * Absent → a hold denies (fail safe). This is the human-in-the-loop seam.
   */
  onHold?: (call: ToolCall, result: GuardResult) => boolean | Promise<boolean>;
}

/**
 * Turn a verdict into an action. Resolves when the call may proceed; throws
 * `GuardBlockedError` when it must not. Pure control-flow over the verdict —
 * no Jev call here (that already happened in `guard`).
 */
export async function enforce(call: ToolCall, result: GuardResult, opts: EnforceOptions = {}): Promise<void> {
  if (opts.mode === 'observe') return;
  if (result.verdict === 'allow') return;
  if (result.verdict === 'block') throw new GuardBlockedError(call, result);

  // hold → ask the human if a handler is wired; otherwise deny (fail safe).
  const approved = opts.onHold ? await opts.onHold(call, result) : false;
  if (!approved) throw new GuardBlockedError(call, result);
}
