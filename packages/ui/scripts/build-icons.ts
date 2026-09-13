/**
 * Extract the icons named in src/icons/sets.ts into one JSON file.
 *
 * Iconify sets hold thousands of icons. Pulling only the named ones keeps the
 * bundle to what is actually rendered, and the output is committed so a build
 * never has to reach the network.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getIcons } from '@iconify/utils';
import { icons as bx } from '@iconify-json/bx';
import { icons as faBrands } from '@iconify-json/fa-brands';
import { icons as fluent } from '@iconify-json/fluent';
import { icons as hugeicons } from '@iconify-json/hugeicons';
import { icons as ic } from '@iconify-json/ic';
import { icons as iconoir } from '@iconify-json/iconoir';
import { icons as ix } from '@iconify-json/ix';
import { icons as majesticons } from '@iconify-json/majesticons';
import { icons as materialSymbols } from '@iconify-json/material-symbols';
import { icons as mdi } from '@iconify-json/mdi';
import { icons as mi } from '@iconify-json/mi';
import { icons as mynaui } from '@iconify-json/mynaui';
import { icons as ph } from '@iconify-json/ph';
import { icons as solar } from '@iconify-json/solar';
import { icons as streamlinePlump } from '@iconify-json/streamline-plump';

import { iconSets } from '../src/icons/sets.ts';

const sources = {
  bx,
  'fa-brands': faBrands,
  fluent,
  hugeicons,
  ic,
  iconoir,
  ix,
  majesticons,
  'material-symbols': materialSymbols,
  mdi,
  mi,
  mynaui,
  ph,
  solar,
  'streamline-plump': streamlinePlump,
};

const collections = Object.entries(iconSets).map(([name, wanted]) => {
  const source = sources[name as keyof typeof sources];
  const extracted = getIcons(source, [...wanted]);

  if (!extracted) {
    throw new Error(`No icons matched for the ${name} set`);
  }

  // An alias lands in `aliases`, not `icons`, so both count as found.
  const missing = wanted.filter(
    (icon) => !(icon in extracted.icons) && !(icon in (extracted.aliases ?? {}))
  );

  if (missing.length > 0) {
    throw new Error(`${name} has no icon named: ${missing.join(', ')}`);
  }

  return [name, extracted] as const;
});

const output = fileURLToPath(new URL('../src/icons/icons.json', import.meta.url));

writeFileSync(output, `${JSON.stringify(Object.fromEntries(collections), null, 2)}\n`);

const total = collections.reduce(
  (count, [, collection]) => count + Object.keys(collection.icons).length,
  0
);

process.stdout.write(`built ${total} icons across ${collections.length} set(s)\n`);
