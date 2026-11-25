import { Fragment } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AkSkeleton } from '@irene/ui/ak-skeleton';

/**
 * One section's card while it loads.
 *
 * It keeps the card's own chrome — the border, the tinted header, the rule and
 * the body's padding — and stands in only for the words, so nothing moves when
 * the account arrives.
 *
 * @param props.rows - How many label-and-value pairs the section holds.
 */
function SectionSkeleton({ rows }: Readonly<{ rows: number }>) {
  return (
    <div className="w-full rounded-xs border border-border">
      <div className="flex items-center justify-between bg-neutral-100 px-5.25 py-3.5">
        <AkSkeleton width="11rem" height="1.25rem" />

        <AkSkeleton variant="rectangular" width="2rem" height="2rem" />
      </div>

      <AkDivider color="dark" />

      <div className="flex flex-col gap-3.5 bg-background p-5.25">
        {Array.from({ length: rows }, (_unused, row) => (
          <Fragment key={row}>
            <AkSkeleton width="10rem" height="1rem" />

            <AkSkeleton width="18rem" height="1rem" />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * The service account screen while the account it is about is being read.
 *
 * It draws the screen the account will fill: the trail, the header card and the
 * four sections under it, each at the size and in the place the real one takes.
 */
export function ServiceAccountScreenSkeleton() {
  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col bg-background-subtle"
      data-test-service-account-screen-skeleton
    >
      <div className="pt-3.5 pb-5.25">
        <AkSkeleton width="18rem" height="1.25rem" />
      </div>

      <div
        className="
          flex items-center justify-between gap-2.75 rounded-xs border border-border bg-background
          p-5.25
        "
      >
        <div className="flex flex-col gap-1">
          <AkSkeleton width="14rem" height="1.25rem" />

          <AkSkeleton width="26rem" height="1rem" />
        </div>

        <AkSkeleton variant="rectangular" width="2.25rem" height="2.25rem" />
      </div>

      <div className="my-5.25 flex w-full flex-col gap-5.25">
        {/* The account's name and description, its key, what it may do, and what it reaches. */}
        <SectionSkeleton rows={2} />

        <SectionSkeleton rows={2} />

        <SectionSkeleton rows={3} />

        <SectionSkeleton rows={1} />
      </div>
    </div>
  );
}
