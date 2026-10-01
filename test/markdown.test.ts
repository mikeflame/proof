import { describe, expect, it } from 'vitest';
import { parseDocument, statementId } from '../src/parse/markdown.ts';

const parse = (md: string) => parseDocument(md, 'CLAUDE.md');
const spans = (md: string) => parse(md).statements.flatMap((s) => s.spans.map((x) => `${x.text}:${x.expect}`));

describe('statements', () => {
  it('splits list items, table rows, sentences and fenced commands with their lines', () => {
    const doc = parse('# T\n\n- one `a.ts`\n- two\n\nFirst sentence here. Second one, e.g. this.\n\n| Col | Val |\n| --- | --- |\n| `b.ts` | x |\n\n```bash\nyarn dev\n# comment\nyarn test\n```\n');
    expect(doc.statements.map((s) => [s.line, s.kind, s.text])).toEqual([
      [3, 'item', 'one `a.ts`'],
      [4, 'item', 'two'],
      [6, 'sentence', 'First sentence here.'],
      [6, 'sentence', 'Second one, e.g. this.'],
      [10, 'row', '`b.ts` · x'],
      [13, 'command', 'yarn dev'],
      [15, 'command', 'yarn test'],
    ]);
  });

  it('joins a sentence across soft line breaks and keeps the line it starts on', () => {
    const doc = parse('# T\n\nA folder moves, the version goes\nup, and sessions start wrong. Next one\nhere.\n');
    expect(doc.statements.map((s) => [s.line, s.text])).toEqual([
      [3, 'A folder moves, the version goes up, and sessions start wrong.'],
      [4, 'Next one here.'],
    ]);
  });

  it('reads only lines that run something in an unlabelled fence', () => {
    const doc = parse('# T\n\n```\n# REPORT: NOT PROVEN\n- ✗ `src/x/` — not found\nyarn dev\n```\n');
    expect(doc.statements.map((s) => s.text)).toEqual(['yarn dev']);
  });

  it('keeps the id across line moves and changes it when the words change', () => {
    expect(statementId('Run `yarn dev`.')).toBe(statementId('Run  `yarn dev`.'));
    expect(statementId('Run `yarn dev`.')).not.toBe(statementId('Run `yarn start`.'));
  });
});

describe('negation', () => {
  it('turns the subject of a removal into an absence check, only in its clause', () => {
    expect(spans('- The `waiting_on` block was deleted; `kept_one` stays.\n')).toEqual(['waiting_on:absent', 'kept_one:present']);
  });

  it('keeps the new name of a rename present', () => {
    expect(spans('- `old_name` was renamed to `new_name`.\n')).toEqual(['old_name:absent', 'new_name:present']);
  });

  it('reads a parenthetical removal as negating the name before it', () => {
    expect(spans('- No `styled-components` (it is not a project dependency).\n')).toEqual(['styled-components:absent']);
  });

  it('does not negate names in other clauses of a long item', () => {
    expect(spans('- `axi` renders a row and nothing else: the `review_block` was deleted, because `formatRow` was lossy.\n')).toEqual(['axi:present', 'review_block:absent', 'formatRow:present']);
  });

  it('leaves no description to check when the removal is the whole claim', () => {
    expect(parse('- The `waiting_on` block was deleted.\n').statements[0]?.residual).toEqual([]);
  });
});

describe('markers, imports and frontmatter', () => {
  it('reads a marker with a reason as an override and one without as a finding', () => {
    const doc = parse('<!-- proof:ignore reason="vendor docs" -->\n- `a.ts` exists.\n\n<!-- proof:ignore -->\n- `b.ts` exists.\n');
    expect(doc.statements.find((s) => s.text.includes('a.ts'))?.override?.reason).toBe('vendor docs');
    expect(doc.statements.find((s) => s.text.includes('b.ts'))?.override).toBeUndefined();
    expect(doc.statements.some((s) => s.kind === 'marker')).toBe(true);
  });

  it('finds @imports outside code, never e-mail addresses or code spans', () => {
    const doc = parse('See @README.md and a@b.com. Then `@x` too.\n');
    expect(doc.imports.map((i) => i.path)).toEqual(['README.md']);
  });

  it('reads paths frontmatter as glob claims and reports frontmatter that does not parse', () => {
    expect(parse('---\npaths:\n  - "src/**/*.ts"\n---\n\n- x\n').paths).toEqual(['src/**/*.ts']);
    expect(parse('---\npaths: [unclosed\n---\n\n- x\n').frontmatterError).not.toBeNull();
  });
});
