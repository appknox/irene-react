import { AkSkeleton } from '@irene/ui/ak-skeleton';

/* One placeholder per tab, each roughly as wide as the label it stands in for. */
const TAB_WIDTHS = ['3.75rem', '3.5rem', '8.5rem', '10.5rem'];

/**
 * Stands in for the account settings screen while it loads.
 *
 * Draws the frame the screen settles into — the heading, the tab row and the
 * bordered panel — so the chrome does not appear only once the screen is ready.
 * It mirrors `AccountSettingsLayout`, and the two change together.
 */
export function AccountSettingsSkeleton() {
  return (
    <div className="w-full px-5.25 pt-3.5 pb-5.25" data-test-account-settings-skeleton>
      <div className="mx-auto w-full max-w-300">
        <AkSkeleton width="7.5rem" height="1rem" className="mt-1.75 mb-5.25" />

        <div
          className="
            flex h-10 items-center gap-7 border border-b-0 border-border bg-background px-4
          "
        >
          {TAB_WIDTHS.map((width) => (
            <AkSkeleton key={width} width={width} height="0.875rem" />
          ))}
        </div>

        <div className="flex flex-col gap-3.5 border border-t-0 border-border bg-background p-3.5">
          <AkSkeleton width="5rem" height="1.15rem" />

          <AkSkeleton width="13rem" height="1rem" />

          <AkSkeleton variant="rounded" width="17.85rem" height="2.5rem" />
        </div>
      </div>
    </div>
  );
}
