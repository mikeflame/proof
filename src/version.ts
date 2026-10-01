import { readFileSync } from 'node:fs';

declare const __PROOF_VERSION__: string | undefined;

/**
 * The one version source is package.json (spec 9.3): the build injects it as a constant and writes it
 * into the plugin manifest; run from the sources, it is read from package.json.
 */
export const VERSION: string =
  typeof __PROOF_VERSION__ === 'string' ? __PROOF_VERSION__ : (JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }).version;
