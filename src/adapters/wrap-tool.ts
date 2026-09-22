import type { JevProvider } from '../providers/jev-provider.js';
import type { GuardPolicy, ToolCall } from '../policy.js';
import { guard, type GuardOptions } from '../guard.js';
import { enforce, type EnforceOptions } from '../enforce.js';

export interface WrapToolOptions extends GuardOptions, EnforceOptions {
  /** derive the agent's task from the args, for off-task detection. */
  taskOf?: (args: Record<string, unknown>) => string | undefined;
}

/**
 * Wrap a tool's execute function so every call is guarded (and enforced) before it runs.
 * Framework-agnostic — the LangChain / Vercel adapters are thin specializations of this.
 *
 * @returns a drop-in replacement execute that throws `GuardBlockedError` on block/denied-hold.
 */
export function wrapTool<Args extends Record<string, unknown>, R>(
  toolName: string,
  execute: (args: Args) => R | Promise<R>,
  policy: GuardPolicy,
  provider: JevProvider,
  opts: WrapToolOptions = {},
): (args: Args) => Promise<R> {
  return async (args: Args): Promise<R> => {
    const task = opts.taskOf?.(args);
    const call: ToolCall = { tool: toolName, arguments: args, ...(task ? { task } : {}) };
    const result = await guard(call, policy, provider, opts);
    await enforce(call, result, opts);
    return execute(args);
  };
}
