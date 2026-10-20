import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { TOP_ISSUES_LIMIT } from '@/queries/analytics';

/**
 * The headline band, while the counts are still being read.
 *
 * Each stub stands at the height of the type it replaces and in the box that
 * type sits in, so the band does not resize when the counts arrive.
 */
export function ScanPostureSkeleton() {
  return (
    <section
      className="flex flex-col rounded-sm border border-border bg-background shadow-3"
      data-test-scan-posture-skeleton
    >
      <div className="flex flex-col gap-4 px-5 py-4.5 md:flex-row md:items-center md:gap-10">
        <div className="flex shrink-0 flex-col">
          <AkSkeleton variant="rectangular" className="h-8 w-32" />

          <AkSkeleton variant="rectangular" className="h-5 w-28" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <AkSkeleton variant="rectangular" className="h-2.5 w-20" />

          <AkSkeleton variant="rectangular" className="h-2.5 w-full rounded-full" />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {Array.from({ length: 2 }, (_, platform) => (
              <span key={platform} className="flex items-center gap-1.5">
                <AkSkeleton variant="rectangular" className="size-2 rounded-full" />

                <AkSkeleton variant="rectangular" className="h-5 w-14" />

                <AkSkeleton variant="rectangular" className="h-5 w-20" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-px border-t border-divider bg-divider sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, kind) => (
          <li key={kind} className="flex flex-col gap-1 bg-background px-5 py-3.5">
            <AkSkeleton variant="rectangular" className="h-2.5 w-14" />

            <AkSkeleton variant="rectangular" className="h-7 w-20" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The calendar's own shape: a strip of weeks per year, with its weekday ticks.
 *
 * It stands at the height the strips take, so the card does not resize and the
 * eye does not move when the days arrive.
 *
 * @param props.years - How many years the span touches.
 */
export function ActivityCalendarSkeleton({ years }: Readonly<{ years: number }>) {
  return (
    <div className="flex flex-col divide-y divide-divider" data-test-chart-skeleton>
      {Array.from({ length: years }, (_, strip) => (
        <div key={strip} className="flex h-44 gap-2.5 py-3 first:pt-0 last:pb-0">
          <div className="flex w-6 shrink-0 flex-col justify-evenly py-6">
            {Array.from({ length: 3 }, (_, tick) => (
              <AkSkeleton key={tick} variant="rectangular" className="h-2.5 w-6" />
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <AkSkeleton variant="rectangular" className="h-2.5 w-24" />

            <AkSkeleton variant="rectangular" className="flex-1 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** What the chart keeps to the right of the longest bar for its count and chips. */
const ISSUE_LABEL_WIDTH = '300px';

/**
 * The ranking's own shape: a name, a bar and its count per row, the bars
 * shortening down the list.
 *
 * Each row is laid out as the chart lays one out, so nothing moves when the
 * bars arrive: the name is 12px axis type ending where the bars begin, a bar
 * is the 20px the chart caps one at, and the count follows the end of its own
 * bar rather than sitting in a column of its own.
 */
export function IssuesSkeleton() {
  return (
    <ul className="flex h-96 flex-col justify-around" data-test-issues-skeleton>
      {Array.from({ length: TOP_ISSUES_LIMIT }, (_, row) => (
        <li key={row} className="flex items-center gap-2">
          <AkSkeleton variant="rectangular" width="20rem" height="12px" className="shrink-0" />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <AkSkeleton
              variant="rectangular"
              width={`calc((100% - ${ISSUE_LABEL_WIDTH}) * ${Math.max(1 - row * 0.07, 0.1)})`}
              height="20px"
              className="shrink-0 rounded-xs"
            />

            <AkSkeleton variant="rectangular" width="8rem" height="12px" className="shrink-0" />
          </div>
        </li>
      ))}
    </ul>
  );
}
