import type { ToolCall } from '../policy.js';

/**
 * Build the Jev `state` from a proposed tool call. Pure; text/JSON only.
 * Arguments are passed structurally — Jev evaluates them as data, not prose.
 */
export function buildState(call: ToolCall): Record<string, unknown> {
  return {
    tool: call.tool,
    arguments: call.arguments,
    ...(call.task ? { task: call.task } : {}),
  };
}
