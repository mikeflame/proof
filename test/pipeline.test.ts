import { describe, expect, it } from 'vitest';
import type { CheckedStatement } from '../src/model.ts';
import { verdictOf } from '../src/pipeline.ts';
import { checkFiles, statementWith } from './helpers.ts';

const st = (status: CheckedStatement['status'], level: 'definition' | 'reference' = 'definition'): CheckedStatement =>
  ({ status, results: [{ kind: 'path', text: 'x', expect: 'present', status: status === 'VERIFIED' ? 'VERIFIED' : 'NOT_CHECKED', level, evidence: [], reason: '' }] }) as unknown as CheckedStatement;

describe('verdict ladder (spec 4.6)', () => {
  it('ranks stale over open over overrides over proven', () => {
    expect(verdictOf([st('VERIFIED'), st('STALE')])).toBe('NOT PROVEN');
    expect(verdictOf([st('VERIFIED'), st('UNCONFIRMED')])).toBe('PARTLY PROVEN');
    expect(verdictOf([st('VERIFIED'), st('OVERRIDDEN')])).toBe('PROVEN WITH OVERRIDES');
    expect(verdictOf([st('VERIFIED', 'reference')])).toBe('PROVEN WITH OVERRIDES');
    expect(verdictOf([st('VERIFIED'), st('NOT_CHECKED')])).toBe('PROVEN');
    expect(verdictOf([st('NOT_CHECKED')])).toBe('PARTLY PROVEN');
  });
});

describe('statements', () => {
  it('gives every statement at least one result', async () => {
    const r = await checkFiles({ 'CLAUDE.md': '# T\n\nNo inline styles. Keep components small.\n\n- `a.ts`\n', 'a.ts': 'export {};\n' });
    expect(r.coverage.statements).toBeGreaterThan(0);
    expect(r.coverage.withResult).toBe(r.coverage.statements);
  });

  it('keeps a statement with a description open even when its names check out', async () => {
    const r = await checkFiles({ 'CLAUDE.md': '# T\n\n- `src/` holds the business logic.\n- `src/`\n', 'src/a.ts': 'export {};\n' });
    expect(statementWith(r, 'business logic').status).toBe('UNVERIFIED_WITH_REASON');
    expect(r.statements.find((s) => s.text === '`src/`')?.status).toBe('VERIFIED');
  });

  it('reports a marker without a reason and honors one with a reason (criterion 7)', async () => {
    const r = await checkFiles({
      'CLAUDE.md': '# T\n\n<!-- proof:ignore reason="lives in the vendor repo" -->\n- `vendor/x.ts` exists.\n\n- `a.ts`\n',
      'a.ts': 'export {};\n',
    });
    expect(statementWith(r, 'vendor/x.ts').status).toBe('OVERRIDDEN');
    expect(r.verdict).toBe('PROVEN WITH OVERRIDES');
    const bare = await checkFiles({ 'CLAUDE.md': '# T\n\n<!-- proof:ignore -->\n- `vendor/x.ts` exists.\n', 'vendor/.keep': '' });
    expect(bare.statements.some((s) => s.kind === 'marker' && s.status === 'UNVERIFIED_WITH_REASON')).toBe(true);
    expect(statementWith(bare, 'vendor/x.ts').status).toBe('STALE');
  });
});
