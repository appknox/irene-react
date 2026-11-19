import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { PageWrapper } from '@/components/page-wrapper';

/** A findings card's place; the first is the overall finding, which carries the AI chip. */
function FindingCardSkeleton({ first }: Readonly<{ first: boolean }>) {
  return (
    <div
      className="flex w-full flex-col gap-3 border border-border bg-background p-6"
      data-test-sk-fake-app-details-skeleton-finding
    >
      {first && <AkSkeleton width="100px" height="24px" />}

      <div className="flex w-full justify-between">
        <div className="flex max-w-155 flex-1 flex-col gap-1">
          <AkSkeleton width="200px" height="20px" />

          <AkSkeleton height="16px" />

          <AkSkeleton width="90%" height="16px" />

          <AkSkeleton width="70%" height="16px" />
        </div>

        <AkSkeleton width="60px" height="32px" className="self-end" />
      </div>
    </div>
  );
}

/**
 * The page's shape while the copy and its app load: the header, six findings cards and the
 * original app's panel, sized like the real ones so nothing shifts when they arrive.
 */
export function DetailsSkeleton() {
  return (
    <PageWrapper contentWidth="standard" aria-busy="true" data-test-sk-fake-app-details-skeleton>
      <span className="sr-only">{akMT('loading')}</span>

      <div className="w-full pb-6" data-test-sk-fake-app-details-skeleton-header>
        <div className="pb-6">
          <AkSkeleton width="250px" height="16px" />
        </div>

        <div className="flex w-full justify-between gap-2 border border-border bg-background p-6">
          <div className="flex items-center gap-4">
            <AkSkeleton variant="circular" width="58px" height="58px" />

            <div className="flex flex-col gap-1.5">
              <AkSkeleton width="200px" height="24px" />

              <AkSkeleton width="280px" height="16px" />
            </div>
          </div>

          <div className="flex items-center gap-3 self-end">
            <AkSkeleton width="110px" height="36px" />

            <AkSkeleton width="180px" height="36px" />
          </div>
        </div>

        <div className="flex w-full gap-2 border border-t-0 border-border bg-background px-4 py-2">
          <AkSkeleton width="60px" height="30px" />

          <AkSkeleton width="90px" height="30px" />

          <AkSkeleton width="60px" height="30px" />
        </div>
      </div>

      <div className="flex w-full items-stretch gap-4">
        <div className="flex w-[70%] flex-col gap-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <FindingCardSkeleton key={index} first={index === 0} />
          ))}
        </div>

        <div
          className="
            flex h-fit w-full max-w-100 flex-col gap-3 border border-border bg-background p-6
          "
          data-test-sk-fake-app-details-skeleton-original-app
        >
          <AkSkeleton width="150px" height="20px" />

          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <AkSkeleton key={index} height="20px" />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
