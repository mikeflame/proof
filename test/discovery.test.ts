import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileGlob, expandBraces } from '../src/core/glob.ts';
import { RepoContext } from '../src/core/repo.ts';
import { discover } from '../src/discover.ts';
import { type FileReport, MAX_IMPORT_HOPS, Run } from '../src/pipeline.ts';
import { makeRepo } from './fixtures/edge.ts';
import { checkFiles, spanOf } from './helpers.ts';

async function checkAll(files: Record<string, string>, targets?: string[]): Promise<FileReport[]> {
  const f = makeRepo(files);
  try {
    const run = new Run(f.repo);
    const found = discover(run.repo).files;
    return await run.checkTargets(targets ? targets.map((t) => found.find((d) => d.file === t) ?? { file: t, why: 'named', scope: 'project' }) : found);
  } finally {
    f.cleanup();
  }
}

const byFile = (reports: FileReport[], file: string): FileReport => {
  const r = reports.find((x) => x.file === file);
  if (!r) throw new Error(`no report for ${file}: ${reports.map((x) => x.file).join(', ')}`);
  return r;
};

describe('discover', () => {
  it('finds the files every agent loads, root first, and says why', () => {
    const f = makeRepo({
      'CLAUDE.md': '- x\n',
      '.claude/CLAUDE.md': '- x\n',
      'AGENTS.md': '- x\n',
      '.claude/rules/web/style.md': '- x\n',
      'api/CLAUDE.md': '- x\n',
      '.github/copilot-instructions.md': '- x\n',
      '.github/instructions/api.instructions.md': '- x\n',
      'GEMINI.md': '- x\n',
      '.cursor/rules/style.mdc': '- x\n',
      '.cursorrules': '- x\n',
      '.windsurfrules': '- x\n',
      '.clinerules/a.md': '- x\n',
      'CONVENTIONS.md': '- x\n',
      'README.md': '- x\n',
      '.gitignore': 'CLAUDE.local.md\n',
      'CLAUDE.local.md': '- mine\n',
    });
    try {
      const { files } = discover(new RepoContext(f.repo));
      expect(files.map((d) => d.file).sort()).toEqual(
        ['.claude/CLAUDE.md', '.claude/rules/web/style.md', '.clinerules/a.md', '.cursor/rules/style.mdc', '.cursorrules', '.github/copilot-instructions.md', '.github/instructions/api.instructions.md', '.windsurfrules', 'AGENTS.md', 'CLAUDE.local.md', 'CLAUDE.md', 'CONVENTIONS.md', 'GEMINI.md', 'api/CLAUDE.md'].sort(),
      );
      const depths = files.map((d) => d.file.split('/').length);
      expect(depths).toEqual([...depths].sort((a, b) => a - b));
      expect(files.find((d) => d.file === 'CLAUDE.local.md')?.scope).toBe('local');
      expect(files.find((d) => d.file === 'AGENTS.md')?.why).toContain('only when no CLAUDE.md');
    } finally {
      f.cleanup();
    }
  });

  it('reports what it leaves out instead of dropping it', () => {
    const f = makeRepo({ 'AGENTS.local.md': '- x\n', '.agents/skills/a/AGENTS.md': '- x\n', 'test/fixtures/repo/CLAUDE.md': '- x\n', 'CLAUDE.md': '- x\n' });
    try {
      const { files, skipped } = discover(new RepoContext(f.repo));
      expect(files.map((d) => d.file)).toEqual(['CLAUDE.md']);
      expect(skipped.map((s) => s.file).sort()).toEqual(['.agents/skills/a/AGENTS.md', 'test/fixtures/repo/CLAUDE.md']);
    } finally {
      f.cleanup();
    }
  });

  it('checks a symlinked CLAUDE.md once', () => {
    const f = makeRepo({ 'AGENTS.md': '- x\n' });
    try {
      symlinkSync('AGENTS.md', join(f.repo, 'CLAUDE.md'));
      expect(discover(new RepoContext(f.repo)).files.map((d) => d.file)).toEqual(['AGENTS.md']);
    } finally {
      f.cleanup();
    }
  });
});

describe('imports', () => {
  it('follows @imports recursively, and the importer’s verdict includes what it pulls in (criterion 2)', async () => {
    const reports = await checkAll({ 'CLAUDE.md': '<!-- for Claude -->\n@AGENTS.md\n', 'AGENTS.md': '# A\n\n- See @docs/more.md\n', 'docs/more.md': '- `src/gone.ts` holds it.\n', 'src/a.ts': 'export {};\n' }, ['CLAUDE.md']);
    expect(reports.map((r) => r.file)).toEqual(['CLAUDE.md', 'AGENTS.md', 'docs/more.md']);
    expect(byFile(reports, 'docs/more.md').importedBy).toEqual(['AGENTS.md']);
    expect(byFile(reports, 'CLAUDE.md').ownVerdict).toBe('PROVEN');
    expect(byFile(reports, 'CLAUDE.md').verdict).toBe('NOT PROVEN');
  });

  it(`stops after ${MAX_IMPORT_HOPS} hops, like Claude Code`, async () => {
    const files: Record<string, string> = { 'CLAUDE.md': '@h1.md\n' };
    for (let i = 1; i <= 6; i++) files[`h${i}.md`] = `- level ${i}\n\n@h${i + 1}.md\n`;
    files['h7.md'] = '- end\n';
    const reports = await checkAll(files, ['CLAUDE.md']);
    expect(reports.map((r) => r.file)).toEqual(['CLAUDE.md', 'h1.md', 'h2.md', 'h3.md', 'h4.md']);
    expect(byFile(reports, 'h4.md').imports[0]?.note).toContain('beyond 4 hops');
  });

  it('survives an import cycle', async () => {
    const reports = await checkAll({ 'CLAUDE.md': '@a.md\n', 'a.md': '- a\n\n@CLAUDE.md\n' }, ['CLAUDE.md']);
    expect(reports.map((r) => r.file)).toEqual(['CLAUDE.md', 'a.md']);
    expect(byFile(reports, 'CLAUDE.md').importedBy).toEqual(['a.md']);
  });

  it('never imports from code spans, quotes or fences; reads escaped spaces; loads non-markdown as is', async () => {
    const reports = await checkAll(
      {
        'CLAUDE.md': '- Not `@a.md` and not "@b.md".\n- Yes @Design\\ Docs/api.md and @package.json\n\n```\n@c.md\n```\n',
        'a.md': '- a\n',
        'b.md': '- b\n',
        'c.md': '- c\n',
        'Design Docs/api.md': '- api\n',
        'package.json': '{}\n',
      },
      ['CLAUDE.md'],
    );
    expect(reports.map((r) => r.file)).toEqual(['CLAUDE.md', 'Design Docs/api.md']);
    expect(byFile(reports, 'CLAUDE.md').imports.find((i) => i.path === 'package.json')?.note).toContain('not an instruction file');
  });

  it('does not follow an import outside the repository without --user', async () => {
    const reports = await checkAll({ 'CLAUDE.md': '- Mine: @~/.claude/nonexistent-proof-test.md\n- Up: @../outside.md\n' }, ['CLAUDE.md']);
    expect(reports.map((r) => r.file)).toEqual(['CLAUDE.md']);
  });

  it('reports a broken import as stale and an extension-less near miss as unconfirmed', async () => {
    const r = await checkFiles({ 'CLAUDE.md': '@docs/missing.md\n@README\n', 'README.md': '# R\n' });
    expect(spanOf(r, 'docs/missing.md').status).toBe('STALE');
    expect(spanOf(r, 'README').status).toBe('UNCONFIRMED');
  });

  it('calls a file that states nothing proven', async () => {
    const reports = await checkAll({ 'CLAUDE.md': '- `a.ts`\n\n@README.md\n', 'README.md': '# Title only\n', 'a.ts': 'export {};\n' }, ['CLAUDE.md']);
    expect(byFile(reports, 'README.md').verdict).toBe('PROVEN');
    expect(byFile(reports, 'CLAUDE.md').verdict).toBe('PROVEN');
  });
});

describe('rule globs, as Claude Code reads them', () => {
  it('expands braces and reads [ as a bracket expression', () => {
    expect(expandBraces('src/*.{ts,tsx}')).toEqual(['src/*.ts', 'src/*.tsx']);
    const bracket = compileGlob('pages/[slug]/*.tsx');
    expect('re' in bracket && bracket.re.test('pages/s/a.tsx')).toBe(true);
    expect('error' in compileGlob('photos [2024/**')).toBe(true);
  });

  it('flags a literal [slug] that should be escaped, and an unterminated [', async () => {
    const r = await checkFiles(
      {
        '.claude/rules/pages.md': '---\npaths:\n  - "pages/[slug]/*.tsx"\n---\n\n- x\n',
        '.claude/rules/escaped.md': '---\npaths:\n  - "pages/\\\\[slug\\\\]/*.tsx"\n---\n\n- x\n',
        'pages/[slug]/index.tsx': 'export {};\n',
      },
      '.claude/rules/pages.md',
    );
    expect(spanOf(r, 'pages/[slug]/*.tsx').status).toBe('STALE');
    expect(spanOf(r, 'pages/[slug]/*.tsx').reason).toContain('bracket expression');
    const escaped = await checkFiles({ '.claude/rules/escaped.md': '---\npaths:\n  - "pages/\\\\[slug\\\\]/*.tsx"\n---\n\n- x\n', 'pages/[slug]/index.tsx': 'export {};\n' }, '.claude/rules/escaped.md');
    expect(spanOf(escaped, 'pages/\\[slug\\]/*.tsx').status).toBe('VERIFIED');
  });

  it('keeps a rule alive through its other patterns, and kills it when none match', async () => {
    const r = await checkFiles({ '.github/instructions/infra.instructions.md': "---\napplyTo: ['deploy/**', '**/*.tf']\n---\n\n- x\n", 'deploy/a.yml': 'a: 1\n' }, '.github/instructions/infra.instructions.md');
    expect(spanOf(r, 'deploy/**').status).toBe('VERIFIED');
    expect(spanOf(r, '**/*.tf').status).toBe('UNCONFIRMED');
    const dead = await checkFiles({ '.cursor/rules/tf.mdc': '---\nglobs: "**/*.tf"\n---\n\n- x\n', 'a.ts': '' }, '.cursor/rules/tf.mdc');
    expect(spanOf(dead, '**/*.tf').status).toBe('STALE');
  });

  it('resolves a nested rule’s globs from the folder that holds its .claude/', async () => {
    const r = await checkFiles({ 'web/.claude/rules/ui.md': '---\npaths: "src/**/*.tsx"\n---\n\n- x\n', 'web/src/a.tsx': 'export {};\n' }, 'web/.claude/rules/ui.md');
    expect(spanOf(r, 'src/**/*.tsx').status).toBe('VERIFIED');
  });

  it('reads paths in a config-folder instruction file from the project root', async () => {
    const f = makeRepo({ '.github/copilot-instructions.md': '- Types live in `src/types.ts`.\n- Generated: `gen/out/`.\n', 'src/types.ts': 'export {};\n', '.gitignore': 'gen/\n' });
    try {
      mkdirSync(join(f.repo, 'gen/out'), { recursive: true });
      writeFileSync(join(f.repo, 'gen/out/x.ts'), '');
      const r = await new Run(f.repo).checkFile('.github/copilot-instructions.md');
      expect(spanOf(r, 'src/types.ts').status).toBe('VERIFIED');
      expect(spanOf(r, 'gen/out/').status).toBe('NOT_CHECKED');
    } finally {
      f.cleanup();
    }
  });
});
