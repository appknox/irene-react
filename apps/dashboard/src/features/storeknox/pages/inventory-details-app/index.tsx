import { useQuery } from '@tanstack/react-query';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import {
  DetailsSectionHeader,
  DetailsSectionInfo,
} from '@/features/storeknox/components/details-section';

import {
  fakeAppDetectionIsInitializing,
  monitoringIsDisabledWithNoResults,
  storeMonitoringIsPending,
} from '@/features/storeknox/utils/sk-app';

import { DetailsInfoRows } from '@/features/storeknox/components/details-info-rows';
import { useInventoryApp } from '@/features/storeknox/hooks/use-inventory-app';
import { storeknoxOrganizationOptions } from '@/queries/organization';

import { ActionsList } from './components/actions-list';
import { MonitoringPendingOrDisabled } from './components/monitoring-pending';
import { VaResults } from './components/va-results';

/** Ports irene's `showMonitoringPendingOrDisabledInfo`; without fake-app detection it waits on store monitoring alone. */
function _showsPendingOrDisabled(app: ApiSkInventoryApp, detectsFakeApps: boolean) {
  if (!detectsFakeApps) {
    return (
      storeMonitoringIsPending(app) || (!app.monitoring_enabled && !app.has_store_monitoring_data)
    );
  }

  return (
    (fakeAppDetectionIsInitializing(app) && storeMonitoringIsPending(app)) ||
    monitoringIsDisabledWithNoResults(app)
  );
}

/** One app's details page: its checks, its developer and inventory date, and its latest Appknox scan. */
export function InventoryDetailsAppPage() {
  const app = useInventoryApp();
  const { data: storeknoxOrganization } = useQuery(storeknoxOrganizationOptions());

  const detectsFakeApps = Boolean(storeknoxOrganization?.sk_features.fake_app_detection);

  return (
    <div className="flex w-full flex-col gap-4">
      {_showsPendingOrDisabled(app, detectsFakeApps) ? (
        <MonitoringPendingOrDisabled app={app} />
      ) : (
        <ActionsList app={app} />
      )}

      <div className="flex w-full flex-col">
        <DetailsSectionHeader>
          <AkTypography fontWeight="medium">
            <AkMessageTranslate id="storeknox.appDetails" />
          </AkTypography>
        </DetailsSectionHeader>

        <DetailsSectionInfo className="items-center">
          <DetailsInfoRows
            rows={[
              {
                id: 'developer',
                title: akMT('storeknox.developer'),
                value: app.app_metadata.dev_name,
              },
              { id: 'email-id', title: akMT('emailId'), value: app.app_metadata.dev_email },
              {
                id: 'date-added',
                title: akMT('storeknox.addedToInventoryOn'),
                value: formatDateTime(app.added_on, 'mediumDate'),
              },
            ]}
          />
        </DetailsSectionInfo>
      </div>

      <VaResults app={app} />
    </div>
  );
}
