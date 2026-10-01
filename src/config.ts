import type { RepoContext } from './core/repo.ts';

/**
 * `.proof.yaml` at the repository root, read from the checked-out tree. Spec 9.1. Every knob can only
 * tighten what proof does: it can switch fix tiers off or name owners, never accept weaker evidence.
 */
export interface ProofConfig {
  /** Extra instruction files to check, relative to the root. */
  instructionFiles: string[];
  /** Fact kinds and the file that owns each ("commands": "package.json"): tier C points at these. */
  ownership: Record<string, string>;
  autofix: { A: boolean; B: boolean; C: boolean };
  budgetUsd: number | null;
}

export const DEFAULT_CONFIG: ProofConfig = { instructionFiles: [], ownership: {}, autofix: { A: true, B: true, C: true }, budgetUsd: null };

export function loadConfig(repo: RepoContext): ProofConfig {
  const raw = repo.structured('.proof.yaml') as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  const tiers = (raw.autofix ?? {}) as Record<string, unknown>;
  const tier = (k: 'A' | 'B' | 'C') => (typeof tiers[k] === 'boolean' ? (tiers[k] as boolean) : typeof tiers[k.toLowerCase()] === 'boolean' ? (tiers[k.toLowerCase()] as boolean) : true);
  const own = raw.ownership && typeof raw.ownership === 'object' ? Object.fromEntries(Object.entries(raw.ownership as Record<string, unknown>).filter(([, v]) => typeof v === 'string')) : {};
  return {
    instructionFiles: Array.isArray(raw.instruction_files) ? raw.instruction_files.map(String) : [],
    ownership: own as Record<string, string>,
    autofix: { A: tier('A'), B: tier('B'), C: tier('C') },
    budgetUsd: typeof raw.budget_usd === 'number' && raw.budget_usd > 0 ? raw.budget_usd : null,
  };
}
