import type { ProxyOptions } from 'vite';
/* Relative: the config is loaded by Node, which does not read Vite's aliases. */
import { EMBER_OWNED_PATHS } from '../src/components/ember-paths';

/** Where the Ember app's own dev server listens. */
const EMBER_ORIGIN = 'http://localhost:4210';

/*
  Paths the Ember app serves that have no screen behind them: its bundles, its
  fonts and icons, and the live-reload channel its dev server opens. They are
  listed rather than derived, because no React route will ever claim them.
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
 * Both apps answer on one port, as they do behind one domain in production, so
 * the session and its storage are shared and moving between them is a plain
 * navigation rather than a change of origin.
 *
 * @returns A proxy entry per path Ember owns, for `server.proxy`.
 */
export function emberProxy(): Record<string, ProxyOptions> {
  const paths = [...EMBER_OWNED_PATHS, ...EMBER_ASSET_PATHS];

  return Object.fromEntries(paths.map((path) => [path, { target: EMBER_ORIGIN, ws: true }]));
}
