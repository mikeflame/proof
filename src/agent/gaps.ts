import type { RepoContext } from '../core/repo.ts';
import { runClaude } from './claude.ts';
import { checkEvidence } from './evidence.ts';
import { EVIDENCE_KINDS } from './rules.ts';

/** A line the file does not have and a new session would need: proposed, never written. Spec 5.4. */
export interface GapProposal {
  text: string;
  section: string;
  reason: string;
  evidence: { kind: string; ref: string; excerpt?: string | undefined; valid: boolean; problem: string }[];
}

const SCHEMA = {
  type: 'object',
  properties: {
    proposals: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          section: { type: 'string' },
          reason: { type: 'string' },
          evidence: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: [...EVIDENCE_KINDS] }, ref: { type: 'string' }, excerpt: { type: 'string', maxLength: 200 } }, required: ['kind', 'ref'] } },
        },
        required: ['text', 'section', 'reason', 'evidence'],
      },
    },
  },
  required: ['proposals'],
} as const;

const RULES = [
  'Propose at most five facts a new agent session in this repository would need and the file does not state: a command, a layout fact, a convention the tooling enforces.',
  'Each proposal is one line in the file\'s own style and names the section it belongs in.',
  'Each cites evidence (file_line with an excerpt, or a read-only command): a proposal without a citation that checks out is dropped.',
  'Never propose what the file already says, a restatement of tool defaults, or anything the code makes obvious at a glance.',
  'Never edit, create or delete files.',
];

/** Ask for gap proposals for one file; keep those whose citations check out. */
export async function proposeGaps(repo: RepoContext, file: string, text: string, opts: { model: string; effort: string; budgetUsd: number; timeoutMs: number }): Promise<{ proposals: GapProposal[]; costUsd: number; failure: string | null }> {
  const prompt = [`You look for what the instruction file ${file} is missing, against the repository in your working directory.`, '', 'Rules:', ...RULES.map((r, i) => `${i + 1}. ${r}`), '', '<file>', text, '</file>'].join('\n');
  const result = await runClaude({ cwd: repo.root, prompt, schema: SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: opts.budgetUsd * 0.8, tools: ['Read', 'Grep', 'Glob', 'Bash'], allowedTools: ['Read', 'Grep', 'Glob', 'Bash(git log:*)', 'Bash(git ls-files:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(grep:*)'], timeoutMs: opts.timeoutMs });
  if (!result.ok) return { proposals: [], costUsd: result.costUsd, failure: `${result.subtype}${result.error ? ` (${result.error})` : ''}` };
  const raw = (result.structured as { proposals?: { text?: unknown; section?: unknown; reason?: unknown; evidence?: unknown }[] } | null)?.proposals ?? [];
  const proposals: GapProposal[] = [];
  for (const p of raw.slice(0, 5)) {
    if (typeof p.text !== 'string' || !p.text.trim()) continue;
    const cited = Array.isArray(p.evidence) ? p.evidence.filter((e): e is { kind: string; ref: string; excerpt?: string } => Boolean(e) && typeof (e as { ref?: unknown }).ref === 'string' && typeof (e as { kind?: unknown }).kind === 'string') : [];
    const evidence = cited.slice(0, 4).map((e) => {
      const c = checkEvidence(repo, e);
      return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
    });
    if (!evidence.some((e) => e.valid)) continue;
    proposals.push({ text: p.text.trim().split('\n')[0] ?? '', section: typeof p.section === 'string' ? p.section : '', reason: typeof p.reason === 'string' ? p.reason : '', evidence });
  }
  return { proposals, costUsd: result.costUsd, failure: null };
}
