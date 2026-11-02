import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/** Every source file under a directory, following it down. */
function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

const roots = [resolve(import.meta.dirname, '../..', 'src'), resolve(import.meta.dirname, '../../../../packages/ui/src')];

/*
  The stylesheet this app is embedded with is confined to the element it mounts
  into and to anything marked `data-slot`. Anything rendered through a portal
  leaves that element for `document.body`, so without the mark it keeps the
  host's styling and none of its own — a tooltip with no background, a dialog
  with no panel.
*/
describe('what this app renders outside its own element', () => {
  const portalling = roots
    .flatMap(sourceFiles)
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
    .filter(({ source }) => /createPortal\(|Primitive\.Portal/.test(source));

  it('finds the files that portal, so a rename fails rather than passes quietly', () => {
    expect(portalling.length).toBeGreaterThan(0);
  });

  it.each(portalling.map(({ path, source }) => [path.split('/src/')[1] ?? path, source]))(
    'marks what %s renders through a portal',
    (_name, source) => {
      expect(source).toMatch(/data-slot=/);
    }
  );
});
