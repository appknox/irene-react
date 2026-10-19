import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkSkeleton } from '@irene/ui/ak-skeleton';

/*
  Every height here is the one the real element takes, so nothing moves when the
  page replaces this: the page heading is 16px type, a section heading and its
  description are both 14px, the register button is h-9, and the refresh control
  is a 30px square.
*/

/** A heading with the line under it, as both halves of this page are introduced. */
function SectionHeadingSkeleton() {
  return (
    <div className="flex flex-col gap-1.75">
      <AkSkeleton width="11rem" height="14px" />

      <AkSkeleton width="26rem" height="14px" />
    </div>
  );
}

/**
 * Holds the CYOD tab's shape while its code is fetched, so the tab answers the
 * click instead of leaving the previous page on screen.
 */
export function CyodSettingsSkeleton() {
  return (
    <section
      className="flex w-full flex-col gap-3.5 p-5.25"
      aria-busy
      data-test-cyod-settings-skeleton
    >
      <span className="sr-only">{akMT('loading')}</span>

      <AkSkeleton width="14rem" height="16px" />

      {/* Device registration, and the control that opens the drawer. */}
      <div className="flex w-full items-start justify-between gap-3.5">
        <SectionHeadingSkeleton />

        <AkSkeleton width="9.5rem" height="36px" className="shrink-0" />
      </div>

      <AkDivider color="dark" />

      {/* The connected device table, and the control that refetches it. */}
      <div className="flex w-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3.5">
          <SectionHeadingSkeleton />

          <AkSkeleton width="30px" height="30px" className="shrink-0" />
        </div>

        <AkSkeleton height="70px" />
      </div>
    </section>
  );
}
