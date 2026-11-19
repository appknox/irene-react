import { AkSkeleton } from '@irene/ui/ak-skeleton';

/** A card's place while the listing loads, sized to the card so nothing shifts when it arrives. */
export function FakeAppInventoryCardSkeleton() {
  return (
    <div
      className="flex w-full flex-col bg-background shadow-15"
      data-test-sk-fake-app-card-skeleton
    >
      <div className="flex w-full items-center justify-between gap-2 px-6 py-4">
        <div className="flex items-center gap-4">
          <AkSkeleton variant="circular" width="58px" height="58px" />

          <div className="flex flex-col gap-1.5">
            <AkSkeleton width="180px" height="24px" />

            <AkSkeleton width="200px" height="16px" />

            <AkSkeleton width="150px" height="16px" />
          </div>
        </div>

        <AkSkeleton width="16px" height="16px" className="self-end" />
      </div>

      <hr className="mx-6 border-border" />

      <div className="flex w-full flex-col items-center gap-2 py-6">
        <AkSkeleton variant="circular" width="34px" height="34px" />

        <AkSkeleton width="40px" height="32px" />

        <AkSkeleton width="120px" height="16px" />
      </div>

      <div className="flex w-full flex-col items-center px-6">
        <hr className="w-full border-border" />

        <div className="mt-6 flex w-full flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <AkSkeleton width="90px" height="16px" />

              <AkSkeleton width="60px" height="16px" />
            </div>

            <AkSkeleton height="12px" />
          </div>

          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <AkSkeleton width="70px" height="16px" />

              <AkSkeleton width="60px" height="16px" />
            </div>

            <AkSkeleton height="12px" />
          </div>
        </div>

        <hr className="mt-5 w-full border-border" />

        <div className="flex w-full flex-col items-start gap-2 pt-5 pb-7">
          <AkSkeleton width="150px" height="16px" />

          <AkSkeleton width="100px" height="16px" />
        </div>
      </div>
    </div>
  );
}
