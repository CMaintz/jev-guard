// Generates demo.cast (asciinema v2) with correct ANSI escapes, then you render it:
//   node demo/build-cast.mjs && npx svg-term-cli --in demo/demo.cast --out demo/demo.svg --window
import { writeFileSync } from 'node:fs';

const E = '\x1b'; // real ESC — JSON.stringify emits it as 
const dim = (s) => `${E}[90m${s}${E}[0m`;
const cyan = (s) => `${E}[1;36m${s}${E}[0m`;
const blockBadge = `${E}[1;41m BLOCK ${E}[0m${E}[31m jev-guard${E}[0m`;
const allowBadge = `${E}[1;42m ALLOW ${E}[0m${E}[32m jev-guard${E}[0m`;

const steps = [
  [0.4, dim("# an AI agent's tool calls, vetted by jev-guard before they run") + '\r\n'],
  [0.9, '\r\n' + cyan('agent') + '  clearing the build cache...\r\n'],
  [0.7, dim('  -> bash:') + ' rm -rf /var/lib/postgresql/data\r\n'],
  [1.1, '  ' + blockBadge + dim('  destructive 0.97 . risk 2.4 . 502ms') + '\r\n'],
  [0.6, `  ${E}[31mx the tool never ran${E}[0m\r\n`],
  [1.1, '\r\n' + cyan('agent') + '  ok, just list the files...\r\n'],
  [0.7, dim('  -> bash:') + ' ls -la\r\n'],
  [1.0, '  ' + allowBadge + dim('  risk 0.08 . 359ms') + '\r\n'],
  [0.6, dim('  total 48  drwxr-xr-x  app  README.md  src  dist ...') + '\r\n'],
  [1.2, '\r\n' + dim('# every call typed, confidence-gated - ~400ms, ~free.') + '\r\n'],
  [1.4, ' '],
];

const header = { version: 2, width: 76, height: 15, env: { SHELL: '/bin/bash', TERM: 'xterm-256color' } };
let t = 0;
let out = JSON.stringify(header) + '\n';
for (const [d, text] of steps) {
  t += d;
  out += JSON.stringify([Number(t.toFixed(2)), 'o', text]) + '\n';
}
writeFileSync(new URL('./demo.cast', import.meta.url), out);
console.log('wrote demo/demo.cast');
