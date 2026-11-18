import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/*
  Relative, with its extension: this runs under Node, which reads neither
  Vite's aliases nor an import that leaves its extension off.
*/
import { EMBER_OWNED_PATHS } from '../src/components/ember-paths.ts';

/**
 * Bakes the ledger into the image, for the server to read at boot.
 *
 * The deployed server cannot import from this app's source, so the list it
 * answers requests from is written out here, at the same build that produces
 * the bundles it sits beside. One ledger, one build, no drift.
 *
 * @param outputPath - Where to write the list.
 */
export function writeEmberPaths(outputPath: string): void {
  writeFileSync(outputPath, `${JSON.stringify(EMBER_OWNED_PATHS, null, 2)}\n`);
}

if (process.argv[1]?.endsWith('write-ember-paths.ts')) {
  const [, , target] = process.argv;

  writeEmberPaths(resolve(target ?? 'dist/ember-owned-paths.json'));
}
