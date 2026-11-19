import { Link } from '@tanstack/react-router';

import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';

import { isFakeAppAddedToInventory, isFakeAppIgnored } from '@/features/storeknox/utils/fake-app';

/**
 * The note above an ignored copy: when it was ignored, and a link to the inventory app when it was
 * added to the inventory. The wording follows the status; the link needs the inventory app's id.
 *
 * @param props.fakeApp - The copy; nothing renders unless it has been ignored.
 */
export function IgnoredBanner({ fakeApp }: Readonly<{ fakeApp: ApiSkFakeApp }>) {
  if (!isFakeAppIgnored(fakeApp)) {
    return null;
  }

  const addedToInventory = isFakeAppAddedToInventory(fakeApp);

  return (
    <div
      role="status"
      className="flex h-11 w-full items-center gap-3 bg-warning-surface px-6 text-warning-strong"
      data-test-sk-fake-app-ignored-banner
    >
      <AkIcon name="material-symbols:warning" />

      <AkTypography color="inherit">
        {addedToInventory
          ? akMT('storeknox.fakeApps.ignoredBannerIgnoredAndAddedToInventory')
          : akMT('storeknox.fakeApps.ignoredBannerIgnored')}{' '}
        <strong>{formatDateTime(fakeApp.reviewed_on, 'mediumDate')}</strong>
        {addedToInventory && '.'}
      </AkTypography>

      {addedToInventory && fakeApp.added_to_inventory_app !== null && (
        <Link
          to="/dashboard/storeknox/inventory-details/$id"
          params={{ id: String(fakeApp.added_to_inventory_app) }}
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary"
        >
          {akMT('storeknox.viewInInventory')}

          <AkIcon name="material-symbols:arrow-right-alt" className="size-4" />
        </Link>
      )}
    </div>
  );
}
