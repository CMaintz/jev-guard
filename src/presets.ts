import { noul, score, type GuardPolicy, type Readout } from './policy.js';

/**
 * Ready-made policies for the common dangerous tool classes. Use directly, or spread
 * and tweak: `{ ...shellPolicy(), escalateBelow: 0.9, perTool: { echo: 'allow' } }`.
 * These are sensible defaults, not a security boundary — see the README.
 */

const RISK_LEVELS = ['none', 'local-reversible', 'local-destructive', 'external-or-irreversible'];
const num = (r: Readout | undefined): number => (typeof r?.value === 'number' ? r.value : 0);

/** Shell/bash execution — the highest-blast-radius tool class. */
export function shellPolicy(): GuardPolicy {
  return {
    dimensions: {
      risk: score(RISK_LEVELS, 'Blast radius if this shell command runs unintended'),
      destructive: noul('Does this permanently delete or overwrite data (rm -rf, dd, mkfs, truncating redirects)?'),
      exfiltrates: noul('Does this send data to an external destination (curl/scp/nc to a remote host)?'),
    },
    decide: (r) => {
      if (num(r.destructive) >= 0.8 && num(r.risk) >= 2) return 'block';
      if (num(r.exfiltrates) >= 0.7 || num(r.risk) >= 3) return 'hold';
      return 'allow';
    },
    escalateBelow: 0.7,
  };
}

/** File writes/deletes — guards against clobbering and escaping the workspace. */
export function filesystemPolicy(): GuardPolicy {
  return {
    dimensions: {
      destructive: noul('Does this delete or overwrite an existing file or directory?'),
      outsideWorkspace: noul(
        'Does this path point outside the project workspace (absolute/system path, or ../ escaping the repo)?',
      ),
    },
    decide: (r) => {
      if (num(r.destructive) >= 0.8 && num(r.outsideWorkspace) >= 0.5) return 'block';
      if (num(r.destructive) >= 0.8 || num(r.outsideWorkspace) >= 0.8) return 'hold';
      return 'allow';
    },
    escalateBelow: 0.7,
  };
}

/** SQL execution — blocks unscoped mutations (DELETE/UPDATE without WHERE, DROP, TRUNCATE). */
export function sqlPolicy(): GuardPolicy {
  return {
    dimensions: {
      mutating: noul(
        'Is this a data-mutating or schema-changing statement (INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER)?',
      ),
      unscoped: noul('Does a DELETE/UPDATE lack a WHERE clause, or is this a DROP/TRUNCATE affecting a whole table?'),
    },
    decide: (r) => {
      if (num(r.unscoped) >= 0.7) return 'block';
      if (num(r.mutating) >= 0.8) return 'hold';
      return 'allow';
    },
    escalateBelow: 0.7,
  };
}

/** Money movement — high-stakes: any transfer holds for a human, near-certainty required. */
export function paymentsPolicy(): GuardPolicy {
  return {
    dimensions: {
      movesMoney: noul('Does this move money or change a financial balance/subscription?'),
      irreversible: noul('Is this transfer hard to reverse (external payout, crypto, wire)?'),
    },
    decide: (r) => (num(r.movesMoney) >= 0.5 ? 'hold' : 'allow'),
    escalateBelow: 0.9,
  };
}
