// CHANGELOG.md from conventional commits, one section per version tag (spec 9.3).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout.trim();
const TYPES = { feat: 'Features', fix: 'Fixes', perf: 'Performance', docs: 'Documentation', refactor: 'Internals', test: 'Tests', chore: null, ci: null, build: null };

/** Render the changelog; `next` names the version the untagged commits will be released as. */
export function changelog(next) {
  const tags = git('tag', '--list', 'v*', '--sort=-v:refname').split('\n').filter(Boolean);
  const ranges = [[next ? `v${next}` : 'Unreleased', tags[0] ? `${tags[0]}..HEAD` : 'HEAD'], ...tags.map((t, i) => [t, tags[i + 1] ? `${tags[i + 1]}..${t}` : t])];
  const out = ['# Changelog', '', 'Generated from conventional commits by `npm run changelog`.', ''];
  for (const [title, range] of ranges) {
    const commits = git('log', '--format=%h%x09%s', range).split('\n').filter(Boolean);
    const groups = new Map();
    for (const line of commits) {
      const [hash, subject = ''] = line.split('\t');
      const m = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/.exec(subject);
      const type = m?.[1] ?? 'other';
      const heading = type in TYPES ? TYPES[type] : 'Other';
      if (!heading) continue;
      groups.set(heading, [...(groups.get(heading) ?? []), `- ${m?.[3] ? '**breaking** ' : ''}${m?.[2] ? `${m[2]}: ` : ''}${m?.[4] ?? subject} (${hash})`]);
    }
    if (!groups.size) continue;
    out.push(`## ${title}`, '');
    for (const [heading, items] of groups) out.push(`### ${heading}`, '', ...items, '');
  }
  return `${out.join('\n').trimEnd()}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const next = process.argv[2] ?? null;
  writeFileSync(join(root, 'CHANGELOG.md'), changelog(next));
  console.log(`CHANGELOG.md written${next ? ` for v${next}` : ''}`);
}

