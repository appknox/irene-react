import { useNProgress } from '@tanem/react-nprogress';
import { useRouterState, type AnyRouter, type RouterState } from '@tanstack/react-router';

import { getStoredSession } from '@irene/api/utils/session';
import { RoutePending } from '@/components/route-pending';
import { Route as authenticatedRoute } from '@/routes/_authenticated';

/** The state of the first load. */
type AppBootStatus = 'loading' | 'loaded' | 'failed';

/**
 * The loading screen shown over the app until the first page is ready.
 *
 * @param router - The router.
 * @returns The boot overlay.
 */
export function BootOverlay({ router }: Readonly<{ router: AnyRouter }>) {
  const currentRouteStatus = useRouterState({ router, select: selectBootStatus });
  const hasSession = getStoredSession() !== null;

  const isBooting = currentRouteStatus === 'loading' && hasSession;
  const currentRouteLoadingFailed = currentRouteStatus === 'failed';
  const { animationDuration, isFinished, progress } = useNProgress({ isAnimating: isBooting });

  // `isFinished` is true before the first load, and again once the bar has run to 100.
  if (currentRouteLoadingFailed || isFinished) {
    return null;
  }

  return (
    <div
      style={{
        opacity: isBooting ? 1 : 0,
        transition: `opacity ${animationDuration}ms linear`,
      }}
      className="fixed inset-0 z-100 bg-background"
      data-test-boot-overlay
    >
      <RoutePending progress={progress * 100} />
    </div>
  );
}

/**
 * Reads the boot status from the router.
 *
 * A failed route renders its own error, so it is never covered. Loading means
 * the first load, or the signed-in loader running after a sign-in.
 *
 * @param state - The router's state.
 * @returns The boot status.
 */
function selectBootStatus(state: RouterState): AppBootStatus {
  // Check if any route is in error
  if (state.matches.some((match) => match.status === 'error')) {
    return 'failed';
  }

  // Check if the authenticated route is still loading
  const isSetupPending = state.matches.some(
    (match) => match.routeId === authenticatedRoute.id && match.status === 'pending'
  );

  // Check if the resolved location is undefined or the authenticated route is still loading
  if (state.resolvedLocation === undefined || isSetupPending) {
    return 'loading';
  }

  // If the authenticated route is not loading, return loaded
  return 'loaded';
}
