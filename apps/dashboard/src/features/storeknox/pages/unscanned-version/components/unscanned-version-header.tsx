import { useQuery } from '@tanstack/react-query';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkAccordion } from '@irene/ui/ak-accordion';
import { AkChip } from '@irene/ui/ak-chip';
import { AkTabs, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { DetailsInfoRows } from '@/features/storeknox/components/details-info-rows';
import { DetailsSectionInfo } from '@/features/storeknox/components/details-section';
import { skFileOptions } from '@/features/storeknox/queries/inventory';
import { isDecommissioned } from '@/features/storeknox/utils/sk-app';

/** The monitoring state's chip label: decommissioned, active or inactive. */
const _monitoringLabel = (app: ApiSkInventoryApp) => {
  if (isDecommissioned(app)) {
    return akMT('storeknox.decommissioned');
  }

  return app.monitoring_enabled ? akMT('active') : akMT('inactive');
};

/** The unscanned-versions section's tabs, and an overview of the last scanned version and last monitored date. */
export function UnscannedVersionHeader({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  const matchRoute = useMatchRoute();
  const [showOverview, setShowOverview] = useState(false);
  const params = { id: String(app.id) };
  const fileId = app.core_project_latest_version;

  const { data: latestFile } = useQuery({
    ...skFileOptions(fileId ?? ''),
    enabled: fileId !== null,
  });

  const historyOpen = Boolean(
    matchRoute({
      to: '/dashboard/storeknox/inventory-details/$id/unscanned-version/history',
      params,
    })
  );

  return (
    <div className="flex w-full flex-col">
      <AkTabs value={historyOpen ? 'history' : 'details'} activationMode="manual">
        <AkTabsList variant="shadow">
          <AkTabsTrigger value="details" asChild>
            <Link to="/dashboard/storeknox/inventory-details/$id/unscanned-version" params={params}>
              {akMT('storeknox.monitoringDetails')}
            </Link>
          </AkTabsTrigger>

          <AkTabsTrigger value="history" asChild>
            <Link
              to="/dashboard/storeknox/inventory-details/$id/unscanned-version/history"
              params={params}
            >
              {akMT('storeknox.monitoringHistory')}
            </Link>
          </AkTabsTrigger>
        </AkTabsList>
      </AkTabs>

      <AkAccordion
        variant="light"
        summaryText={akMT('storeknox.storeMonitoringOverview')}
        isExpanded={showOverview}
        onExpandedChange={setShowOverview}
        className="my-6"
      >
        <DetailsSectionInfo className="items-center">
          <DetailsInfoRows
            rows={[
              {
                id: 'file-id',
                title: akMT('fileID'),
                value: fileId !== null && (
                  <Link
                    to="/dashboard/file/$fileId"
                    params={{ fileId: String(fileId) }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {fileId}
                  </Link>
                ),
              },
              {
                id: 'last-scanned-version',
                title: akMT('storeknox.lastScannedVersion'),
                value: latestFile?.version,
              },
              {
                id: 'last-monitored-on',
                title: akMT('storeknox.lastMonitoredOn'),
                value: formatDateTime(app.last_monitored_on, 'longDate'),
              },
              {
                id: 'monitoring-status',
                title: akMT('storeknox.monitoringStatus'),
                value: (
                  <AkChip
                    size="small"
                    variant="semi-filled"
                    color={app.monitoring_enabled ? 'success' : 'error'}
                    label={_monitoringLabel(app)}
                  />
                ),
              },
            ]}
          />
        </DetailsSectionInfo>
      </AkAccordion>
    </div>
  );
}
