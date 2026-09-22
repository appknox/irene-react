import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

/** How long the work runs before it is reported, so a fast page or request causes no flicker. */
const SHOW_AFTER_MS = 150;

/*
  How long it stays reported after the work finishes. A page usually asks for
  one thing after another, and this covers the gap between them rather than
  flashing once per request.
*/
const HIDE_AFTER_MS = 250;

/**
 * Whether the user is waiting on the app: a page being navigated to, or
 * anything a page has asked the API for.
 *
 * A first load does not count. It has no page on screen to report over, and
 * the boot overlay reports it instead.
 *
 * @returns Whether to report work, and an id for the stretch of work being
 * reported. The id changes as the work starts rather than a render later, so an
 * indicator keyed by it begins afresh instead of running down from where the
 * last one ended.
 */
export function useIsAppBusy() {
  const isNavigating = useRouterState({
    select: (state) => state.isLoading && state.resolvedLocation !== undefined,
  });

  const fetchCount = useIsFetching();
  const mutationCount = useIsMutating();
  const isBusy = isNavigating || fetchCount > 0 || mutationCount > 0;
  const [reported, setReported] = useState({ isBusy: false, busyId: 0 });

  useEffect(() => {
    const settle = setTimeout(
      () =>
        setReported((previous) => {
          if (!isBusy) {
            return previous.isBusy ? { ...previous, isBusy: false } : previous;
          }

          // Work already being reported keeps its id; a new stretch takes the next.
          return previous.isBusy ? previous : { isBusy: true, busyId: previous.busyId + 1 };
        }),
      isBusy ? SHOW_AFTER_MS : HIDE_AFTER_MS
    );

    return () => clearTimeout(settle);
  }, [isBusy]);

  return reported;
}
