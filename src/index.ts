// Public API.
export { guard } from './guard.js';
export type { GuardResult, GuardOptions } from './guard.js';

export { enforce, GuardBlockedError } from './enforce.js';
export type { EnforceOptions } from './enforce.js';

export { wrapTool } from './adapters/wrap-tool.js';
export type { WrapToolOptions } from './adapters/wrap-tool.js';

export { score, noul, choice } from './policy.js';
export type { ToolCall, Verdict, Dimension, Readout, GuardPolicy } from './policy.js';

export type { Decision } from './core/decide.js';

// Shared provider port (verified against docs.typesafe.ai/api).
export { TypeSafeProvider } from './providers/typesafe.js';
export { CloudflareProvider } from './providers/cloudflare.js';
export type { JevProvider } from './providers/jev-provider.js';
