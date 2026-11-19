import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { isArchived, isDecommissioned } from '@/features/storeknox/utils/sk-app';

/** The banner's message, decommissioned first, then archived, then monitoring off. */
function _bannerMessage(app: ApiSkInventoryApp) {
  if (isDecommissioned(app)) {
    return app.decommissioned_on
      ? akMT('storeknox.decommissionedBannerMessage', {
          decommissionedDate: formatDateTime(app.decommissioned_on, 'mediumDate'),
        })
      : akMT('storeknox.decommissionedBannerMessageNoDate');
  }

  if (isArchived(app)) {
    return akMT('storeknox.archivedBannerMessage', {
      archivedDate: formatDateTime(app.archived_on, 'mediumDate'),
      unarchiveDate: formatDateTime(app.unarchive_available_on, 'mediumDate'),
    });
  }

  return akMT('storeknox.monitoringDisabledBannerMessage');
}

/** The warning above an app's details when it is decommissioned, archived or has monitoring off. */
export function DetailsBanner({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  if (!isArchived(app) && !isDecommissioned(app) && app.monitoring_enabled) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex h-11 w-full items-center gap-3 bg-warning-surface px-6 text-warning-strong"
      data-test-sk-details-banner
    >
      <span className="flex items-center justify-center">
        <AkIcon name="material-symbols:warning" />
      </span>

      <AkTypography color="inherit">{_bannerMessage(app)}</AkTypography>
    </div>
  );
}
