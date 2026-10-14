import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';
import type { UploadOutcomeCounts } from '@/features/upload-app/utils';

interface UploadStatusTriggerProps {
  counts: UploadOutcomeCounts;
}

/*
  The ring is drawn to the same geometry as the design system's circular loader:
  a 44 unit viewport, a stroke of 5, and a radius of (44 - 5) / 2, rendered at
  30px. Turning is the same trick too — a short dash chased around the circle.
*/
const RING_VIEWPORT = 44;
const RING_THICKNESS = 5;
const RING_RADIUS = (RING_VIEWPORT - RING_THICKNESS) / 2;

/**
 * The ring in the top bar, which turns while the server is still working.
 *
 * It shows what the account has in flight at a glance: turning while anything
 * is running, and settling into a full circle once everything has landed. It
 * goes red once anything has failed, which is the one state worth interrupting
 * for.
 *
 * @param props.counts - How many uploads failed, are running, and finished.
 */
export function UploadStatusTrigger({ counts }: Readonly<UploadStatusTriggerProps>) {
  const isRunning = counts.running > 0;
  const hasFailed = counts.failed > 0;

  return (
    <span
      className="relative flex size-7.5 items-center justify-center"
      data-test-upload-status-ring
    >
      <svg
        viewBox={`${RING_VIEWPORT / 2} ${RING_VIEWPORT / 2} ${RING_VIEWPORT} ${RING_VIEWPORT}`}
        className={cn('absolute inset-0 size-full -rotate-90', isRunning && 'animate-spin')}
        aria-hidden
      >
        <circle
          cx={RING_VIEWPORT}
          cy={RING_VIEWPORT}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_THICKNESS}
          className={hasFailed ? 'stroke-primary/20' : 'stroke-success-surface'}
        />

        <circle
          cx={RING_VIEWPORT}
          cy={RING_VIEWPORT}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_THICKNESS}
          strokeDasharray={isRunning ? '90 200' : undefined}
          className={hasFailed ? 'stroke-primary' : 'stroke-success'}
        />
      </svg>

      <AkIcon name="material-symbols:file-upload" className="size-4" />
    </span>
  );
}
