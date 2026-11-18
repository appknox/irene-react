import type { ProxyOptions } from 'vite';
/*
  Relative, with its extension: the config is loaded by Node, which reads
  neither Vite's aliases nor an import that leaves its extension off.
*/
import { EMBER_OWNED_PATHS } from '../src/components/ember-paths.ts';

/** Where the Ember app's own dev server listens. */
const EMBER_ORIGIN = 'http://localhost:4210';

/*
  Paths the Ember app serves that no React route will ever claim: its bundles,
  its fonts and icons, and the live-reload channel its dev server opens.

  `/images` is forwarded although this app has a public/images of its own. The
  Ember app holds the full set and this app holds three of them, byte for byte
  the same, so forwarding costs nothing here and serves the Ember pages their
  remaining artwork. An image added to this app's public/images while a path is
  forwarded would not be found, so add it under src and import it instead.
*/
const EMBER_ASSET_PATHS = [
  '/assets',
  '/fonts',
  '/images',
  '/ak-icons.json',
  '/ember-cli-live-reload.js',
  '/_lr',
];

/**
 * What the dev server hands to the Ember app.
 *
 * Both apps answer on one port, as they do behind one domain once deployed, so
 * the session and its storage are shared and crossing between them is a plain
 * navigation rather than a change of origin.
 *
 * @returns A proxy entry per path the Ember app owns, for `server.proxy`.
 */
export function emberProxy(): Record<string, ProxyOptions> {
  const paths = [...EMBER_OWNED_PATHS, ...EMBER_ASSET_PATHS];

  return Object.fromEntries(paths.map((path) => [path, { target: EMBER_ORIGIN, ws: true }]));
}
