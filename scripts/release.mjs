// npm run release -- <version>: set the one version, rebuild everything, write the changelog, commit and tag.
// Pushing the commit and the tag is left to a person.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { changelog } from './changelog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('usage: npm run release -- <major.minor.patch>');
  process.exit(2);
}
const run = (cmd, ...args) => {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
};
if (spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.trim()) {
  console.error('the working tree has changes: commit or stash them first');
  process.exit(1);
}
const pkgFile = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
writeFileSync(pkgFile, `${JSON.stringify({ ...pkg, version }, null, 2)}\n`);
run('node', 'scripts/build.mjs');
writeFileSync(join(root, 'CHANGELOG.md'), changelog(version));
run('git', 'add', '-A');
run('git', 'commit', '-q', '-m', `chore: release v${version}`);
run('git', 'tag', '-a', `v${version}`, '-m', `proof v${version}`);
console.log(`released v${version} locally. Push with: git push && git push origin v${version}`);
