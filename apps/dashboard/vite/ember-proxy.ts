/*
  Serving both apps from one origin.

  The React app holds the origin and forwards the paths it has not taken over
  to the Ember app's dev server, so a page that is still Ember renders at the
  same host and reads the same browser storage.

  The two apps do not agree on URLs: the React app moved most pages under
  `/dashboard`, while Ember serves them at the root. So these are Ember's own
  paths, and an entry leaves this list when the page behind it is migrated.
*/

import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/** Where `ember serve` listens, which the dev script starts it on. */
const EMBER_DEV_SERVER = 'http://localhost:4210';

/** This app's own static files, which answer before the Ember app's. */
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

/**
 * The files the Ember app's pages ask for, which its server answers directly.
 *
 * `/runtimeconfig.js` is not here: both apps ship one at that path, and one
 * origin has room for a single file. The React app's own is served, which both
 * read the same keys from.
 */
const EMBER_ASSET_PATHS = [
  '/assets',
  '/engines-dist',
  '/ember-cli-live-reload.js',
  '/fonts',
  '/ak-icons.json',
];

/**
 * The folders both apps ship, where a file this app has answers first and
 * anything else is the Ember app's.
 */
const SHARED_ASSET_PATHS = ['/images'];

/**
 * The pages the Ember app serves.
 *
 * A string matches by prefix, so `/organization` carries its children with it.
 * `/security` and `/partner` are listed page by page, because the React app
 * serves the rest of both. An entry leaves this list when the page behind it
 * is migrated, together with its entry in `src/components/ember-paths.ts`.
 */
export const EMBER_OWNED_PATHS = [
  '/analytics',
  '/billing',
  '/choose',
  '/dashboard/privacy-module',
  '/dashboard/projects',
  '/dashboard/reports',
  '/dashboard/storeknox',
  '/fake-apps',
  '/file',
  '/github-cloud',
  '/integrations',
  '/invitation',
  '/marketplace',
  '/notifications',
  '/organization',
  '/partner/analytics',
  '/partner/clients',
  '/payment-failure',
  '/payment-success',
  '/public-api',
  '/sbom',
  '/scans',
  '/security/downloadapp',
  '/security/projects',
  '/security/purgeanalysis',
  '/service-account',
  '/settings',
  '/slack-cloud',
  '/store-monitoring',
  '/store-release-readiness',
  '/subscription',
  '/third-party-scans',
  '/vulnerabilities',
];

/**
 * The proxy that hands Ember's paths to its dev server.
 *
 * A page is asked for as `/`, because the Ember dev server answers that alone:
 * every deeper path is the app's own route, which its router reads from the
 * address bar once the page it returns has booted.
 *
 * @returns The `server.proxy` entry for each path Ember owns.
 */
export function emberProxy() {
  const assets = EMBER_ASSET_PATHS.map((path) => [
    path,
    { target: EMBER_DEV_SERVER, changeOrigin: false },
  ]);

  /* `bypass` answering with a path serves this app's file; nothing proxies it. */
  const shared = SHARED_ASSET_PATHS.map((path) => [
    path,
    {
      target: EMBER_DEV_SERVER,
      changeOrigin: false,
      bypass: (request: { url?: string }) => {
        const asked = (request.url ?? '').split('?')[0];

        return asked && existsSync(`${PUBLIC_DIR}${asked}`) ? asked : undefined;
      },
    },
  ]);

  const pages = EMBER_OWNED_PATHS.map((path) => [
    path,
    { target: EMBER_DEV_SERVER, changeOrigin: false, rewrite: () => '/' },
  ]);

  return Object.fromEntries([...assets, ...shared, ...pages]);
}
