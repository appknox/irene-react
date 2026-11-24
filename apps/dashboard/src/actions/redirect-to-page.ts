import { redirect } from '@tanstack/react-router';

import { startEmberHandover } from '@irene/ember-bridge/handover';
import type { FileRouteTypes } from '@/routeTree.gen';

/**
 * Sends a navigation to the page a path names, in whichever app serves it.
 *
 * The root guard hands a path over to Ember, but it does not run again for an
 * internal redirect thrown inside the navigation it already guarded, so a route
 * that redirects asks the ledger itself. `reloadDocument` is required, or the
 * href is treated as an internal navigation and resolves to not-found.
 *
 * @param to - The path to send the navigation to.
 * @throws The redirect, so a guard calls this rather than returning it.
 */
export function redirectToPage(to: FileRouteTypes['to']): never {
  const emberHref = startEmberHandover(to);

  if (emberHref) {
    throw redirect({ href: emberHref, reloadDocument: true, replace: true });
  }

  throw redirect({ to, replace: true });
}
