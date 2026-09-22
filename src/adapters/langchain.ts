import type { JevProvider } from '../providers/jev-provider.js';
import type { GuardPolicy, ToolCall } from '../policy.js';
import { guard, type GuardOptions } from '../guard.js';
import { enforce, type EnforceOptions } from '../enforce.js';

/**
 * Minimal structural shape of LangChain JS's `ToolCallRequest` — declared here so
 * jev-guard carries NO hard dependency on `langchain` (bring your own version).
 */
export interface LangChainToolCallRequest {
  toolCall: { name: string; args: Record<string, unknown>; id?: string };
}
export type LangChainToolHandler = (request: LangChainToolCallRequest) => unknown;

export interface JevGuardMiddlewareOptions extends GuardOptions, EnforceOptions {
  name?: string;
}

/**
 * Build a LangChain agent-middleware config that guards every tool call. Wire it with
 * LangChain's own `createMiddleware`:
 *
 *   import { createMiddleware } from "langchain";
 *   import { jevGuardMiddleware } from "jev-guard/langchain";
 *   const guard = createMiddleware(jevGuardMiddleware(policy, provider));
 *   // createAgent({ ..., middleware: [guard] })
 *
 * A `block` / denied `hold` throws `GuardBlockedError` (fail-closed) via the `wrapToolCall`
 * short-circuit, so the tool never runs. An allowed call falls through to the real handler.
 */
export function jevGuardMiddleware(
  policy: GuardPolicy,
  provider: JevProvider,
  opts: JevGuardMiddlewareOptions = {},
): { name: string; wrapToolCall: (req: LangChainToolCallRequest, handler: LangChainToolHandler) => Promise<unknown> } {
  return {
    name: opts.name ?? 'jev-guard',
    wrapToolCall: async (request, handler) => {
      const call: ToolCall = { tool: request.toolCall.name, arguments: request.toolCall.args };
      const result = await guard(call, policy, provider, opts);
      await enforce(call, result, opts); // throws on block / denied hold
      return handler(request); // allowed → run the real tool
    },
  };
}
