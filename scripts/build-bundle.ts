import { cpSync, existsSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeEmberPaths } from '../apps/dashboard/scripts/write-ember-paths.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EMBER_DIST = join(repoRoot, 'apps/irene/dist');
const REACT_DIST = join(repoRoot, 'apps/dashboard/dist');
const SERVER = join(repoRoot, 'staticserver');

/*
  Files the Ember build emits that the deployed bundle has no use for. Its
  runtimeconfig.js is built from the environment at build time; the server
  renders that route from its own environment instead, and the built copy would
  shadow it.
*/
const DROP_FROM_BUNDLE = ['tests', 'testem.js', 'runtimeconfig.js'];

/**
 * Builds the bundle the deployed server runs from.
 *
 * The Ember app is copied first and its document set aside under its own name,
 * then the React app is copied over it, so the default document is React's and
 * the Ember one is reached only through the ledger. The two assets directories
 * share no filename, which is what lets them merge.
 *
 * @param outputDir - Where to assemble the bundle.
 */
export function buildBundle(outputDir: string): void {
  for (const dist of [EMBER_DIST, REACT_DIST]) {
    if (!existsSync(dist)) {
      throw new Error(`${dist} is missing — run \`pnpm build:all\` first`);
    }
  }

  const dist = join(outputDir, 'dist');

  rmSync(outputDir, { recursive: true, force: true });

  cpSync(EMBER_DIST, dist, { recursive: true });
  renameSync(join(dist, 'index.html'), join(dist, 'ember.html'));
  cpSync(REACT_DIST, dist, { recursive: true });

  for (const name of DROP_FROM_BUNDLE) {
    rmSync(join(dist, name), { recursive: true, force: true });
  }

  writeEmberPaths(join(outputDir, 'ember-owned-paths.json'));
  cpSync(SERVER, outputDir, { recursive: true });

  process.stdout.write(`bundle assembled at ${outputDir}\n`);
}

if (process.argv[1]?.endsWith('build-bundle.ts')) {
  const [, , target] = process.argv;

  buildBundle(resolve(target ?? join(repoRoot, 'bundle')));
}
