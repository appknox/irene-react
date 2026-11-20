import { AkSkeleton } from '@irene/ui/ak-skeleton';

/* One per tab, each about as wide as its label at the tab row's 14px. */
const TAB_LABEL_WIDTHS = ['3.5rem', '3.9rem', '8.6rem', '11.3rem'];

/**
 * Stands in for the account settings screen while it loads.
 *
 * Draws the frame the screen settles into — the heading, the tab row and the
 * panel holding the first tab — so nothing moves once it arrives. It mirrors
 * `AccountSettingsLayout` and the general tab, and changes with them.
 */
export function AccountSettingsSkeleton() {
  return (
    <div className="w-full px-5.25 pt-3.5 pb-5.25" data-test-account-settings-skeleton>
      <div className="mx-auto w-full max-w-300">
        <AkSkeleton width="7.5rem" height="1rem" className="mt-1.75 mb-5.25" />

        {/* The tabs sit against each other; the spacing between them is their own padding. */}
        <div className="flex h-10 items-center border border-b-0 border-border bg-background">
          {TAB_LABEL_WIDTHS.map((width) => (
            <span key={width} className="flex h-full items-center px-4">
              <AkSkeleton width={width} height="0.875rem" />
            </span>
          ))}
        </div>

        {/* The general tab: a heading, a line about it, and the language control. */}
        <div
          className="
            flex flex-col gap-3.5 border border-t-0 border-border bg-background p-3.5 pb-10.5
          "
        >
          <AkSkeleton width="5rem" height="1.15rem" />

          <AkSkeleton width="16.4rem" height="1rem" />

          <AkSkeleton width="17.85rem" height="2rem" />
        </div>
      </div>
    </div>
  );
}
