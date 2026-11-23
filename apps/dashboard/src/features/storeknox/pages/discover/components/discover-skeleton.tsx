import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { PageWrapper } from '@/components/page-wrapper';

/* Every height matches the real element's, so nothing moves when the layout replaces this. */

/**
 * Holds discovery's shape while its code is fetched, so the nav entry answers
 * the click instead of leaving the previous page on screen.
 */
export function DiscoverSkeleton() {
  return (
    <PageWrapper
      contentWidth="standard"
      className="flex flex-col"
      aria-busy
      data-test-sk-discover-skeleton
    >
      <span className="sr-only">{akMT('loading')}</span>

      <div
        className="
          my-2.5 flex items-center justify-between gap-4 border border-border bg-background p-5
        "
      >
        <div className="flex flex-col gap-1">
          <AkSkeleton width="9rem" height="14px" />

          <AkSkeleton width="24rem" height="13px" />
        </div>

        <AkSkeleton width="8rem" height="36px" />
      </div>

      <div className="mb-5 flex gap-4 border-b border-border">
        <AkSkeleton width="9rem" height="40px" />
      </div>

      <div className="flex items-center gap-2.5">
        <AkSkeleton height="36px" className="w-132.5 max-w-full" />

        <AkSkeleton width="6rem" height="36px" />
      </div>
    </PageWrapper>
  );
}
