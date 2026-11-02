/*
  Where a screen that is still Ember's lives.

  The two apps do not agree on URLs: most pages moved under `/dashboard` here,
  while Ember serves them at the root. A screen with no React page yet hands
  over by loading Ember's URL for it, which Ember's router recognises.

  A key leaves this map when the page behind it is migrated. Derived from
  `app/router.ts` in the Ember app, where the paths are declared.
*/

/** The Ember path for each React path that has no screen yet, longest first. */
export const EMBER_PATHS: Record<string, string> = {
  '/dashboard/analytics': '/dashboard/analytics',
  '/dashboard/file': '/dashboard/file',
  '/dashboard/marketplace': '/dashboard/marketplace',
  '/dashboard/notifications': '/dashboard/notifications',
  '/dashboard/oidc': '/dashboard/oidc',
  '/dashboard/organization': '/dashboard/organization',
  '/dashboard/privacy-module': '/dashboard/privacy-module',
  '/dashboard/project': '/dashboard/project',
  '/dashboard/projects': '/dashboard/projects',
  '/dashboard/public-api': '/dashboard/public-api',
  '/dashboard/reports': '/dashboard/reports',
  '/dashboard/sbom': '/dashboard/sbom',
  '/dashboard/settings': '/dashboard/settings',
  '/dashboard/storeknox': '/dashboard/storeknox',
  '/dashboard/store-monitoring': '/dashboard/store-monitoring',
  '/dashboard/store-release-readiness': '/dashboard/store-release-readiness',
  '/dashboard/subscription': '/dashboard/subscription',
  '/partner/analytics': '/partner/analytics',
  '/partner/clients': '/partner/clients',
  '/security/download-app': '/security/downloadapp',
  '/security/projects': '/security/projects',
  '/security/purge-analysis': '/security/purgeanalysis',
};

/**
 * The paths the Ember app still serves, longest first.
 *
 * The same list the dev server proxies and the handover reads, so a path
 * cannot leave one and stay in the other.
 */
export const EMBER_OWNED_PATHS: string[] = [...new Set(Object.values(EMBER_PATHS))].sort(
  (one, other) => other.length - one.length
);

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

/*
  Whether a navigation may be handed over.

  Off until the browser entry point turns it on. A handover replaces the
  document, which only means anything where there is one: under the memory
  history the tests run on, the router would abandon the navigation and never
  arrive anywhere.
*/
let handsOver = false;

/** Lets navigations be handed over to the Ember app. Called once, at startup. */
export function enableEmberHandover() {
  handsOver = true;
}

/**
 * The Ember app's URL for a navigation that belongs to it.
 *
 * Reserves the attempt as `handOverToEmber` does, so a handover that does not
 * land is not tried again, and answers nothing until handovers are enabled.
 *
 * @param pathname - Where the navigation is headed.
 * @returns The URL to load, or nothing where this app serves the path.
 */
export function claimEmberHandover(pathname: string): string | undefined {
  if (!handsOver) {
    return undefined;
  }

  const emberPath = findEmberPath(pathname);

  return emberPath && claimAttempt(pathname) ? emberPath : undefined;
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
 * Reserves an attempt at handing a path over.
 *
 * A second attempt at the same path means the first did not land — the Ember
 * app is not answering — so the attempt is refused and this app renders what
 * it would have rendered.
 *
 * @param pathname - The path being handed over.
 * @returns Whether to go ahead.
 */
function claimAttempt(pathname: string): boolean {
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

  return true;
}

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

  if (!emberPath || !claimAttempt(pathname)) {
    return false;
  }

  window.location.replace(emberPath);

  return true;
}
