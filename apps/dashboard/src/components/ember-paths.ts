/*
  Where a screen that is still Ember's lives.

  The two apps do not agree on URLs: most pages moved under `/dashboard` here,
  while Ember serves them at the root. A screen with no React page yet hands
  over by loading Ember's URL for it, which Ember's router recognises.

  A key leaves this map when the page behind it is migrated. Derived from
  `app/router.ts` in the Ember app, where the paths are declared.
*/

/** The Ember path for each React path that has no screen yet, longest first. */
const EMBER_PATHS: Record<string, string> = {
  '/dashboard/analytics': '/analytics',
  '/dashboard/file': '/file',
  '/dashboard/marketplace': '/marketplace',
  '/dashboard/notifications': '/notifications',
  '/dashboard/organization': '/organization',
  '/dashboard/privacy-module': '/dashboard/privacy-module',
  '/dashboard/project': '/dashboard/project',
  '/dashboard/projects': '/dashboard/projects',
  '/dashboard/public-api': '/public-api',
  '/dashboard/reports': '/dashboard/reports',
  '/dashboard/sbom': '/sbom',
  '/dashboard/storeknox': '/dashboard/storeknox',
  '/dashboard/store-monitoring': '/store-monitoring',
  '/dashboard/store-release-readiness': '/store-release-readiness',
  '/dashboard/subscription': '/subscription',
  '/partner/analytics': '/partner/analytics',
  '/partner/clients': '/partner/clients',
  '/security/download-app': '/security/downloadapp',
  '/security/projects': '/security/projects',
  '/security/purge-analysis': '/security/purgeanalysis',
};

/**
 * The Ember URL a React path hands over to.
 *
 * The longest key wins, so `/dashboard/store-monitoring` is not read as
 * `/dashboard/store`. Whatever follows the key is carried over, which is how
 * the ids in a path reach Ember.
 *
 * @param pathname - The path the browser is on.
 * @returns The Ember path, or nothing where no screen is mapped.
 */
export function findEmberPath(pathname: string): string | undefined {
  const match = Object.keys(EMBER_PATHS)
    .sort((one, other) => other.length - one.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  return match ? `${EMBER_PATHS[match]}${pathname.slice(match.length)}` : undefined;
}

/* Remembers the handover last tried, so one that did not land is not tried again. */
const HANDOVER_KEY = 'irene:ember-handover';

/*
  How long a handover has to land in. Past it the attempt is forgotten, so a
  path visited again later is handed over again; inside it the Ember app is not
  answering and a second attempt would reload for ever.
*/
const HANDOVER_TIMEOUT_MS = 5_000;

/**
 * Loads the Ember app's URL for a path it still serves.
 *
 * A load rather than a navigation: the page belongs to whichever app the
 * document came from. A second attempt at the same path means the first did
 * not land — the Ember app is not running — so nothing is loaded and the
 * caller shows what it would have shown.
 *
 * @param pathname - The path the browser is on.
 * @returns Whether the Ember app is being loaded.
 */
export function handOverToEmber(pathname: string): boolean {
  const emberPath = findEmberPath(pathname);

  if (!emberPath) {
    return false;
  }

  try {
    const [lastPath, lastTriedAt] = (sessionStorage.getItem(HANDOVER_KEY) ?? '').split('|');
    const isRecent = Date.now() - Number(lastTriedAt) < HANDOVER_TIMEOUT_MS;

    if (lastPath === pathname && isRecent) {
      sessionStorage.removeItem(HANDOVER_KEY);

      return false;
    }

    sessionStorage.setItem(HANDOVER_KEY, `${pathname}|${Date.now()}`);
  } catch {
    /* A browser refusing storage still gets one attempt, which is the common case. */
  }

  window.location.replace(emberPath);

  return true;
}
