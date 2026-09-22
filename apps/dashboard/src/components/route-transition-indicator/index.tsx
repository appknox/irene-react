import { useNProgress } from '@tanem/react-nprogress';

import { akMT } from '@irene/translations/intl';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { cn } from '@irene/ui/cn';

import { useIsAppBusy } from '@/hooks/use-is-app-busy';

import styles from './styles.module.css';

/** nprogress reports its progress as a fraction; the bar takes a percentage. */
const COMPLETION_PERCENTAGE = 100;

/** How the wait is shown, until the design is settled. */
export type RouteTransitionVariant = 'bar' | 'wash';

/**
 * Acknowledges work the user is waiting on: a page being navigated to, or
 * anything a page has asked the API for. Neither variant blocks the page, so
 * it can still be read or scrolled meanwhile.
 *
 * @param props.variant - `bar` draws a line across the top of the page; `wash`
 * casts a tint over it with a spinner above, as TanStack's own site does.
 */
export function RouteTransitionIndicator({
  variant = 'bar',
}: Readonly<{ variant?: RouteTransitionVariant }>) {
  const { isBusy, busyId } = useIsAppBusy();
  const active = isBusy || undefined;

  // Render the wash variant.
  if (variant === 'wash') {
    return (
      <div aria-hidden={!isBusy} data-test-route-transition-indicator>
        <div
          data-active={active}
          className={cn('pointer-events-none fixed inset-0 z-50', styles.wash)}
        />

        <output
          aria-label={isBusy ? akMT('loading') : undefined}
          data-active={active}
          className={cn(
            'pointer-events-none fixed top-3 left-1/2 z-50 -translate-x-1/2',
            styles.spinner
          )}
        >
          <AkSpinner className="size-6 text-primary" aria-hidden />
        </output>
      </div>
    );
  }

  return <TransitionBar key={busyId} isBusy={isBusy} />;
}

/**
 * The line across the top of the page. It creeps towards the end while the
 * work runs and completes when it finishes, so the wait reads as progress
 * rather than as something merely spinning.
 *
 * @param props.isBusy - Whether there is work to report.
 */
function TransitionBar({ isBusy }: Readonly<{ isBusy: boolean }>) {
  const { animationDuration, isFinished, progress } = useNProgress({ isAnimating: isBusy });

  return (
    <div
      aria-hidden={isFinished}
      data-active={isBusy || undefined}
      style={{ opacity: isFinished ? 0 : 1, transition: `opacity ${animationDuration}ms linear` }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
      data-test-route-transition-indicator
    >
      <AkProgressLinear
        value={progress * COMPLETION_PERCENTAGE}
        label={akMT('loading')}
        className="h-0.5 rounded-none bg-transparent"
      />
    </div>
  );
}
