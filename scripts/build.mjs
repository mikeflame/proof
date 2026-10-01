// Bundles the CLI into the skill folder and copies the tree-sitter runtime and grammars next to it.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { GRAMMARS } from '../src/core/syntax.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'plugins/proof/skills/claude-md/scripts');
const grammarsOut = join(out, 'grammars');
const wasm = join(dirname(createRequire(import.meta.url).resolve('@vscode/tree-sitter-wasm/package.json')), 'wasm');

await build({
  entryPoints: [join(root, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  legalComments: 'none',
  outfile: join(out, 'proof.mjs'),
  // The bundle is ESM; libraries that call require() need a real one.
  banner: { js: "import { createRequire as __proofRequire } from 'node:module'; const require = __proofRequire(import.meta.url);" },
});

rmSync(grammarsOut, { recursive: true, force: true });
mkdirSync(grammarsOut, { recursive: true });
const files = ['tree-sitter.js', 'tree-sitter.wasm', ...GRAMMARS.map((g) => `tree-sitter-${g}.wasm`)];
const present = new Set(readdirSync(wasm));
const missing = files.filter((f) => !present.has(f));
if (missing.length) throw new Error(`@vscode/tree-sitter-wasm has no ${missing.join(', ')}`);
for (const f of files) copyFileSync(join(wasm, f), join(grammarsOut, f === 'tree-sitter.js' ? 'tree-sitter.cjs' : f));
copyFileSync(join(wasm, '..', 'LICENSE'), join(grammarsOut, 'LICENSE'));
for (const old of ['claims.mjs']) rmSync(join(out, old), { force: true });
console.log(`built ${join(out, 'proof.mjs')} + ${files.length} grammar files`);
