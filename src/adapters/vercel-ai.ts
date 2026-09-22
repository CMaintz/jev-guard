import type { JevProvider } from '../providers/jev-provider.js';
import type { GuardPolicy, ToolCall } from '../policy.js';
import { guard, type GuardOptions } from '../guard.js';
import { enforce, type EnforceOptions } from '../enforce.js';

/**
 * Structural shape of a Vercel AI SDK tool — declared here so jev-guard carries NO hard
 * dependency on the `ai` package. A tool is `tool({ description, inputSchema, execute })`;
 * we only touch `execute`.
 */
export interface VercelTool {
  execute?: (input: Record<string, unknown>, options?: unknown) => unknown;
  [key: string]: unknown;
}

export interface GuardVercelOptions extends GuardOptions, EnforceOptions {}

/**
 * Wrap a Vercel AI SDK tool so its `execute` is guarded, preserving every other field
 * (description, inputSchema). A blocked call throws `GuardBlockedError` before `execute` runs.
 *
 *   import { guardVercelTool } from "jev-guard/vercel";
 *   const safeBash = guardVercelTool("bash", bashTool, policy, provider);
 */
export function guardVercelTool<T extends VercelTool>(
  toolName: string,
  tool: T,
  policy: GuardPolicy,
  provider: JevProvider,
  opts: GuardVercelOptions = {},
): T {
  const original = tool.execute;
  if (!original) return tool;
  return {
    ...tool,
    execute: async (input: Record<string, unknown>, options?: unknown): Promise<unknown> => {
      const call: ToolCall = { tool: toolName, arguments: input };
      const result = await guard(call, policy, provider, opts);
      await enforce(call, result, opts);
      return original(input, options);
    },
  } as T;
}
