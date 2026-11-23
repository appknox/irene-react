import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { PageWrapper } from '@/components/page-wrapper';
import { useOrganization } from '@/hooks/use-organization';

/* Every height matches the real element's, so nothing moves when the layout replaces this. */

/**
 * Holds the inventory's shape while its code is fetched, so the nav entry
 * answers the click instead of leaving the previous page on screen.
 */
export function InventorySkeleton() {
  const { isOwner } = useOrganization();

  return (
    <PageWrapper
      contentWidth="standard"
      className="flex flex-col"
      aria-busy
      data-test-sk-inventory-skeleton
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

        <div className="flex items-center gap-3">
          <AkSkeleton width="7rem" height="36px" />

          {isOwner() && <AkSkeleton width="34px" height="34px" />}
        </div>
      </div>

      <div className="flex items-end gap-4 border border-b-0 border-border bg-background px-4 pt-2">
        <AkSkeleton width="8rem" height="40px" />

        <AkSkeleton width="8rem" height="40px" />
      </div>

      <div className="flex flex-col gap-3 border border-border bg-background p-4">
        <AkSkeleton height="40px" />

        {[0, 1, 2, 3, 4].map((row) => (
          <AkSkeleton key={row} height="52px" />
        ))}
      </div>
    </PageWrapper>
  );
}
