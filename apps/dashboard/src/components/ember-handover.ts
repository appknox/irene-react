import { findEmberPath } from './ember-paths';

/*
  Handing over replaces the document, so it only means anything where there is
  one. Under the memory history the tests run on, the router would abandon the
  navigation and never arrive, so this stays off until the browser entry point
  turns it on.
*/
let handsOver = false;

/** Lets navigations be handed over to the Ember app. Called once, at startup. */
export function enableEmberHandover(): void {
  handsOver = true;
}

/* Remembers the handover last attempted, so one that did not land is not retried. */
const HANDOVER_KEY = 'irene:ember-handover';

/*
  How long a handover has to land in. Past it the attempt is forgotten, so a
  path visited again later is handed over again. Inside it, a second attempt at
  the same path means the Ember app did not answer, and retrying would reload
  the page for ever.
*/
const HANDOVER_TIMEOUT_MS = 5_000;

/**
 * Reserves an attempt at handing a path over.
 *
 * Storage is unavailable in a private window and throws rather than returning
 * nothing, in which case the handover goes ahead unguarded: a page that loads
 * is worth more than one held back by a guard that cannot record anything.
 *
 * @param pathname - The path being handed over.
 * @returns Whether to go ahead.
 */
function claimAttempt(pathname: string): boolean {
  try {
    const previous = sessionStorage.getItem(HANDOVER_KEY);

    if (previous) {
      const [attempted, at] = previous.split('@');

      if (attempted === pathname && Date.now() - Number(at) < HANDOVER_TIMEOUT_MS) {
        sessionStorage.removeItem(HANDOVER_KEY);

        return false;
      }
    }

    sessionStorage.setItem(HANDOVER_KEY, `${pathname}@${Date.now()}`);

    return true;
  } catch {
    return true;
  }
}

/**
 * The Ember app's URL for a navigation that belongs to it.
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
