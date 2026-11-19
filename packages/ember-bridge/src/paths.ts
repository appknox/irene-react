/*
  Where a screen that is still Ember's lives.

  This map is the migration ledger, read by the dev server's proxy, by the
  handover this app performs at navigation, and by the script that bakes the
  list into the deployed image.

  A key leaves this map when the page behind it is migrated, and that single
  edit moves the URL across. Every page starts here, so a key is listed rather
  than a prefix standing in for its children: a blanket would stop a branch
  handing one page back.

  Keys are React paths; values are the Ember path for the same screen. They are
  equal except where the two apps spell a URL differently.
*/

/** The Ember path for each React path that has no screen yet. */
export const EMBER_PATHS = {
  '/login': '/login',
  '/register': '/register',
  '/register-via-invite': '/register-via-invite',
  '/recover': '/recover',
  '/reset': '/reset',
  '/invite': '/invite',
  '/invitation': '/invitation',
  '/saml2/redirect': '/saml2/redirect',
  '/sso/oidc/redirect': '/sso/oidc/redirect',
  '/status': '/status',
  '/dashboard/analytics': '/dashboard/analytics',
  '/dashboard/billing': '/dashboard/billing',
  '/dashboard/file': '/dashboard/file',
  '/dashboard/home': '/dashboard/home',
  '/dashboard/marketplace': '/dashboard/marketplace',
  '/dashboard/notifications': '/dashboard/notifications',
  '/dashboard/offensive-security': '/dashboard/offensive-security',
  '/dashboard/oidc': '/dashboard/oidc',
  '/dashboard/organization': '/dashboard/organization',
  '/dashboard/privacy-module': '/dashboard/privacy-module',
  '/dashboard/project': '/dashboard/project',
  '/dashboard/projects': '/dashboard/projects',
  '/dashboard/public-api': '/dashboard/public-api',
  '/dashboard/reports': '/dashboard/reports',
  '/dashboard/sbom': '/dashboard/sbom',
  '/dashboard/settings': '/dashboard/settings',
  '/dashboard/status': '/dashboard/status',
  '/dashboard/store-monitoring': '/dashboard/store-monitoring',
  '/dashboard/store-release-readiness': '/dashboard/store-release-readiness',
  '/dashboard/storeknox/discover/result': '/dashboard/storeknox/discover/result',
  '/dashboard/storeknox/fake-apps': '/dashboard/storeknox/fake-apps',
  '/dashboard/storeknox/third-party-scans': '/dashboard/storeknox/third-party-scans',
  '/dashboard/subscription': '/dashboard/subscription',
  '/partner/analytics': '/partner/analytics',
  '/partner/clients': '/partner/clients',
  '/security/projects': '/security/projects',
  '/security/download-app': '/security/downloadapp',
  '/security/purge-analysis': '/security/purgeanalysis',
} as const;

/*
  Longest first, so a path is tested against the most specific owner before a
  shorter one that is only a prefix of it. Sorted once here rather than at each
  lookup, because a lookup runs on every authenticated navigation.
*/
const REACT_PATHS = Object.keys(EMBER_PATHS).sort(
  (one, other) => other.length - one.length
) as (keyof typeof EMBER_PATHS)[];

/**
 * The paths the Ember app serves, longest first.
 *
 * The dev proxy forwards these, and the deployed server answers them with the
 * Ember document. Both read this list rather than keeping their own.
 */
export const EMBER_OWNED_PATHS = [...new Set(Object.values(EMBER_PATHS))].sort(
  (one, other) => other.length - one.length
);

/**
 * Whether a path belongs to a screen, rather than to the one above it.
 *
 * A path owns what sits under it but not a sibling that merely starts with the
 * same letters, so `/dashboard/store-monitoring` is not read as a child of
 * `/dashboard/store`.
 *
 * @param pathname - The path being tested.
 * @param owner - The path that may own it.
 * @returns Whether `owner` serves `pathname`.
 */
function owns(pathname: string, owner: string): boolean {
  return pathname === owner || pathname.startsWith(`${owner}/`);
}

/**
 * The Ember URL a React path hands over to.
 *
 * Whatever follows the matched key is carried across unchanged, which is how
 * the ids in a path reach the Ember app.
 *
 * @param pathname - The path the browser is on.
 * @returns The Ember path, or nothing where this app serves it.
 */
export function findEmberPath(pathname: string) {
  const match = REACT_PATHS.find((path) => owns(pathname, path));

  return match ? `${EMBER_PATHS[match]}${pathname.slice(match.length)}` : undefined;
}
