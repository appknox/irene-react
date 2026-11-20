import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import MonitoringOff from '@irene/ui/svgs/sox-monitoring-results-pending-with-monitoring-off.svg?react';
import MonitoringPending from '@irene/ui/svgs/sox-monitoring-results-pending.svg?react';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { DetailsSectionInfo } from '@/features/storeknox/components/details-section';
import { isDecommissioned } from '@/features/storeknox/utils/sk-app';

/** Replaces the checks when the app is decommissioned, results are pending, or monitoring is off with none produced. */
export function MonitoringPendingOrDisabled({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  return (
    <DetailsSectionInfo
      className="min-h-75 flex-col items-center justify-center gap-8 p-12"
      data-test-sk-monitoring-pending
    >
      {isDecommissioned(app) && (
        <>
          <MonitoringOff aria-hidden="true" />

          <div className="flex max-w-121.25 flex-col items-center gap-1">
            <AkTypography variant="h5" align="center">
              <AkMessageTranslate id="storeknox.appDecommissionedHeading" />
            </AkTypography>

            <AkTypography align="center">
              <AkMessageTranslate id="storeknox.decommissionedMsg" />
            </AkTypography>
          </div>
        </>
      )}

      {!isDecommissioned(app) && app.monitoring_enabled && (
        <>
          <MonitoringPending aria-hidden="true" />

          <AkTypography align="center" className="max-w-125">
            <AkMessageTranslate id="storeknox.monitoringResultsPending" />
          </AkTypography>
        </>
      )}

      {!isDecommissioned(app) && !app.monitoring_enabled && (
        <>
          <MonitoringOff aria-hidden="true" />

          <div className="flex max-w-121.25 flex-col items-center gap-1">
            <AkTypography variant="h5" align="center">
              <AkMessageTranslate id="storeknox.enableMonitoringForApp" />
            </AkTypography>

            <AkTypography align="center">
              <AkMessageTranslate id="storeknox.monitoringDisabledWithNoResults" />
            </AkTypography>
          </div>
        </>
      )}
    </DetailsSectionInfo>
  );
}
