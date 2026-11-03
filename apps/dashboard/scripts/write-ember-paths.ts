import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/* Relative: this runs under Node, which does not read Vite's aliases. */
import { EMBER_OWNED_PATHS } from '../src/components/ember-paths.ts';

/**
 * Writes the paths the Ember app still serves to a file the static server reads.
 *
 * The server decides which app answers a URL, and the ledger is the one place
 * that records it. Emitting it rather than repeating it means migrating a
 * screen stays a single edit: remove its entry, and the server stops routing
 * it to Ember on the next build.
 *
 * @param outputPath - Where to write the JSON.
 */
export function writeEmberPaths(outputPath: string) {
  writeFileSync(outputPath, `${JSON.stringify(EMBER_OWNED_PATHS, null, 2)}\n`);
}

if (process.argv[1]?.endsWith('write-ember-paths.ts')) {
  const [, , target] = process.argv;

  writeEmberPaths(resolve(target ?? 'dist/ember-owned-paths.json'));
}
