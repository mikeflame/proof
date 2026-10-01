// Generated surfaces agree (criterion 10), and a fresh machine installs and runs in two commands (criterion 11).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '../src/report.ts';
import { COMMANDS, OPTIONS, STATUSES, VERDICTS } from '../src/vocabulary.ts';
import { makeRepo } from './fixtures/edge.ts';

const ROOT = join(import.meta.dirname, '..');
const BUNDLE = join(ROOT, 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const help = () => spawnSync(process.execPath, [BUNDLE, '--help'], { encoding: 'utf8' }).stdout;

describe('one vocabulary (criterion 10)', () => {
  it('everything generated from src/ matches what is committed', () => {
    const res = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
    expect(res.status, res.stderr).toBe(0);
  });

  it('the report, the skill and the README name the same statuses and verdicts', () => {
    expect(SECTIONS.map((s) => s.title)).toEqual(STATUSES.map((s) => s.title));
    const skill = read('plugins/proof/skills/claude-md/SKILL.md');
    const readme = read('README.md');
    for (const s of STATUSES) {
      expect(skill, s.title).toContain(`| ${s.title} | ${s.meaning} |`);
      expect(readme, s.title).toContain(`| ${s.title} | ${s.meaning} |`);
    }
    for (const v of VERDICTS) {
      expect(skill, v.verdict).toContain(`| \`${v.verdict}\` |`);
      expect(readme, v.verdict).toContain(`| \`${v.verdict}\` |`);
    }
  });

  it('the CLI help, the skill and the README name the same commands, and the CLI accepts every option it lists', () => {
    const text = help();
    const skill = read('plugins/proof/skills/claude-md/SKILL.md');
    const readme = read('README.md');
    for (const c of COMMANDS) {
      expect(text, c.name).toContain(c.usage);
      expect(readme, c.name).toContain(`\`proof ${c.name}\``);
    }
    for (const name of ['check', 'run', 'decide', 'revert']) expect(skill, name).toContain(`proof ${name}`);
    for (const o of OPTIONS) {
      expect(text, o.flag).toContain(o.flag);
      const flag = o.flag.split(' ')[0] ?? '';
      const takesValue = o.flag.includes('<');
      const res = spawnSync(process.execPath, [BUNDLE, 'run', 'NOPE.md', flag, ...(takesValue ? ['1'] : []), '--no-fix', '--json'], { encoding: 'utf8', env: { ...process.env, PROOF_CLAUDE: '/nonexistent' } });
      expect(res.stderr, o.flag).not.toContain('Unknown option');
    }
    expect(spawnSync(process.execPath, [BUNDLE, 'check', '--no-such-flag'], { encoding: 'utf8' }).status).toBe(2);
  });

  it('has one version: package.json, the plugin manifest and the CLI agree', () => {
    const version = (JSON.parse(read('package.json')) as { version: string }).version;
    expect((JSON.parse(read('plugins/proof/.claude-plugin/plugin.json')) as { version: string }).version).toBe(version);
    expect(spawnSync(process.execPath, [BUNDLE, '--version'], { encoding: 'utf8' }).stdout.trim()).toBe(version);
    expect(help()).toContain(`proof ${version}`);
  });
});

describe('install (criterion 11)', () => {
  it('copies the skill for Claude Code and the shared agents layout, idempotently, and the copy runs', () => {
    const home = mkdtempSync(join(tmpdir(), 'proof-home-'));
    const f = makeRepo({ 'CLAUDE.md': '- Sources in `src/`.\n', 'src/a.ts': 'export {};\n' });
    try {
      const env = { ...process.env, HOME: home };
      const first = spawnSync(process.execPath, [BUNDLE, 'install'], { encoding: 'utf8', env });
      expect(first.status, first.stderr).toBe(0);
      expect(first.stdout).toMatch(/installed .*\.claude\/skills\/claude-md/);
      expect(first.stdout).toMatch(/installed .*\.agents\/skills\/claude-md/);
      const installed = join(home, '.claude', 'skills', 'claude-md', 'scripts', 'proof.mjs');
      expect(existsSync(join(home, '.claude', 'skills', 'claude-md', 'SKILL.md'))).toBe(true);
      expect(existsSync(join(home, '.agents', 'skills', 'claude-md', 'scripts', 'grammars', 'tree-sitter-go.wasm'))).toBe(true);
      const again = spawnSync(process.execPath, [BUNDLE, 'install'], { encoding: 'utf8', env });
      expect(again.stdout.match(/unchanged/g)?.length).toBe(2);
      const ran = spawnSync(process.execPath, [installed, 'check', 'CLAUDE.md'], { cwd: f.repo, encoding: 'utf8', env });
      expect(ran.status, ran.stderr).toBe(0);
      expect(ran.stdout).toContain('# CLAUDE.md: PROVEN');
    } finally {
      f.cleanup();
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('never overwrites a different skill that happens to share the name', () => {
    const home = mkdtempSync(join(tmpdir(), 'proof-home-'));
    try {
      mkdirSync(join(home, '.claude', 'skills', 'claude-md'), { recursive: true });
      writeFileSync(join(home, '.claude', 'skills', 'claude-md', 'SKILL.md'), '---\nname: claude-md\n---\nSomeone else’s skill.\n');
      const res = spawnSync(process.execPath, [BUNDLE, 'install', '--claude'], { encoding: 'utf8', env: { ...process.env, HOME: home } });
      expect(res.status).toBe(2);
      expect(res.stdout).toContain('refused');
      expect(readFileSync(join(home, '.claude', 'skills', 'claude-md', 'SKILL.md'), 'utf8')).toContain('Someone else');
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
