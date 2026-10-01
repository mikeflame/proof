// Clone every corpus repository at its pinned commit into $PROOF_CORPUS (default ~/projects/proof-cache/corpus).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const corpusDir = () => process.env.PROOF_CORPUS ?? join(homedir(), 'projects', 'proof-cache', 'corpus');
export const corpus = () => JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'corpus.json'), 'utf8')).repos;

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2];
  mkdirSync(corpusDir(), { recursive: true });
  for (const r of corpus().filter((x) => !only || x.split === only || x.name === only)) {
    const dir = join(corpusDir(), r.name);
    if (!existsSync(join(dir, '.git'))) {
      const res = git(corpusDir(), 'clone', '-q', '--filter=blob:none', '--no-checkout', `https://github.com/${r.repo}`, r.name);
      if (res.status !== 0) throw new Error(`clone ${r.repo}: ${res.stderr}`);
    }
    const co = git(dir, 'checkout', '-q', '--detach', r.sha);
    if (co.status !== 0) throw new Error(`checkout ${r.repo}@${r.sha}: ${co.stderr}`);
    console.log(`${r.name.padEnd(16)} ${r.sha.slice(0, 12)} ${git(dir, 'ls-files').stdout.split('\n').length - 1} files`);
  }
}
