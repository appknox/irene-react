import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { PageWrapper } from '@/components/page-wrapper';

/**
 * The page's shape while the app loads: the breadcrumb, header and risk section, sized like the
 * real ones so nothing shifts when they arrive.
 */
export function DetailsSkeleton() {
  return (
    <PageWrapper contentWidth="standard" aria-busy="true" data-test-sk-third-party-details-skeleton>
      <span className="sr-only">{akMT('loading')}</span>

      <div className="flex w-full flex-col gap-2">
        <AkSkeleton width="250px" height="16px" />

        <div
          className="
            flex w-full items-center justify-between gap-2 border border-border bg-background p-6
          "
        >
          <div className="flex items-center gap-4">
            <AkSkeleton variant="circular" width="58px" height="58px" />

            <div className="flex flex-col gap-1.5">
              <AkSkeleton width="200px" height="24px" />

              <AkSkeleton width="280px" height="16px" />
            </div>
          </div>

          <AkSkeleton width="140px" height="36px" />
        </div>

        <div
          className="
            flex w-full items-center justify-between border border-border bg-background p-6
          "
        >
          <div className="flex flex-col gap-1">
            <AkSkeleton width="80px" height="16px" />

            <AkSkeleton width="120px" height="48px" />

            <AkSkeleton width="160px" height="16px" />
          </div>

          <AkSkeleton variant="circular" width="100px" height="100px" />
        </div>
      </div>
    </PageWrapper>
  );
}
