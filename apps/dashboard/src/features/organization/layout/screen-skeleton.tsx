import { AkSkeleton } from '@irene/ui/ak-skeleton';

/*
  The chrome every page of this area shares, drawn as itself: the trail, the organization's
  name and its control, the row of tabs with their marks, and a list of rows. Nothing is
  tinted, outlined or boxed — the grey of the stand-ins is the only colour here.
*/

/** The tabs this area draws, as the width each one's name takes. */
const TAB_WIDTHS = ['w-25', 'w-20', 'w-18.75', 'w-31.25'];

/** How many rows the list stands in with. */
const ROW_COUNT = 5;

/** What each row's cells hold, as the share of the row they take. */
const CELL_WIDTHS = ['w-1/4', 'w-1/5', 'w-1/6', 'w-1/5'];

/** One row of the list, drawn as the cells it will hold. */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4.25 py-3.5">
      {CELL_WIDTHS.map((width) => (
        <AkSkeleton key={width} className={`h-3.5 ${width}`} />
      ))}
    </div>
  );
}

/**
 * The organization area while its code and its first page are on the way.
 *
 * Every page here sits in the same frame, so the frame is what stands in: the
 * trail, the organization's name and the tabs, with a list under them. The page
 * that arrives draws its own content into that same frame.
 */
export function OrganizationScreenSkeleton() {
  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col"
      data-test-organization-screen-skeleton
    >
      {/* The trail: two steps and the mark between them. */}
      <div className="flex items-center gap-1 pt-3.5 pb-5.25">
        <AkSkeleton className="h-3.5 w-20" />

        <AkSkeleton className="h-3.5 w-1" />

        <AkSkeleton className="h-3.5 w-15" />
      </div>

      <div className="flex items-center justify-between gap-3.5 p-3.5">
        <div className="flex flex-col gap-1">
          <AkSkeleton className="h-3 w-31.25" />

          <AkSkeleton className="h-5 w-50" />
        </div>

        <AkSkeleton variant="rectangular" className="h-9 w-37.5 rounded-xs" />
      </div>

      <div className="mt-5.25 flex items-center gap-5.25">
        {TAB_WIDTHS.map((width) => (
          <div key={width} className="flex items-center gap-1.75 pb-3.5">
            <AkSkeleton variant="circular" className="size-4.75" />

            <AkSkeleton className={`h-3.5 ${width}`} />
          </div>
        ))}
      </div>

      <div className="mt-5.25 flex w-full flex-col">
        <div className="flex items-center justify-between gap-3.5 p-3.5">
          <div className="flex flex-col gap-1">
            <AkSkeleton className="h-4 w-37.5" />

            <AkSkeleton className="h-3 w-75" />
          </div>

          <AkSkeleton variant="rectangular" className="h-9 w-25 rounded-xs" />
        </div>

        <div className="flex items-center gap-3.5 px-4.25 py-2.75">
          {CELL_WIDTHS.map((width) => (
            <AkSkeleton key={width} className={`h-3.5 ${width}`} />
          ))}
        </div>

        {Array.from({ length: ROW_COUNT }, (_unused, row) => (
          <RowSkeleton key={row} />
        ))}
      </div>
    </div>
  );
}
