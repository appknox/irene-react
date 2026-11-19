import { AkSkeleton } from '@irene/ui/ak-skeleton';

/**
 * Stands in for a screen while its code arrives.
 *
 * Sized to a panel rather than a page: the host has already drawn everything
 * around this, so what is missing is one region, and this app's own cold-start
 * screen would read as a fault here.
 *
 * It carries the page container a screen renders inside, because the screen
 * holds that container in the chunk still being fetched. Without it the
 * placeholder spans the whole host and the content jumps inwards on arrival.
 */
export function PageSkeleton() {
  return (
    <div className="-m-1.75 w-full px-5.25 pt-3.5 pb-5.25" data-test-embed-page-skeleton>
      <div className="mx-auto flex w-full max-w-300 flex-col gap-5.25">
        <AkSkeleton width="14rem" height="1.75rem" />

        <div className="flex flex-col gap-3.5">
          <AkSkeleton height="1.2rem" />

          <AkSkeleton height="1.2rem" />

          <AkSkeleton width="60%" height="1.2rem" />
        </div>

        <AkSkeleton variant="rectangular" height="12rem" />
      </div>
    </div>
  );
}
