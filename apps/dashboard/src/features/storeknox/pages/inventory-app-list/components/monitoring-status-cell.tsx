import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import ActionNeededIcon from '@irene/ui/svgs/sox-monitoring-stats-icons/action-needed.svg?react';
import DisabledIcon from '@irene/ui/svgs/sox-monitoring-stats-icons/disabled.svg?react';
import InitializingIcon from '@irene/ui/svgs/sox-monitoring-stats-icons/initializing.svg?react';
import NoActionNeededIcon from '@irene/ui/svgs/sox-monitoring-stats-icons/no-action-needed.svg?react';
import type { ApiSkApp } from '@irene/api/services/storeknox';

import {
  getMonitoringIcon,
  getMonitoringReason,
  getMonitoringStatusText,
  reasonHasDetectedSuffix,
  type SkMonitoringIcon,
} from '@/features/storeknox/utils/monitoring-status';

const ICONS = {
  disabled: DisabledIcon,
  'action-needed': ActionNeededIcon,
  initializing: InitializingIcon,
  'no-action-needed': NoActionNeededIcon,
} satisfies Record<SkMonitoringIcon, unknown>;

interface MonitoringStatusCellProps {
  app?: ApiSkApp;
  detectsFakeApps: boolean;
}

/**
 * An app's monitoring status as an icon and a label, with the reason for it
 * on hover.
 *
 * @param props.app - Absent while its row loads.
 * @param props.detectsFakeApps - Whether the organization has fake-app detection, which changes the reason.
 */
export function MonitoringStatusCell({
  app,
  detectsFakeApps,
}: Readonly<MonitoringStatusCellProps>) {
  if (!app) {
    return (
      <span className="flex items-center gap-1">
        <AkSkeleton variant="circular" width="16px" height="16px" />

        <AkSkeleton variant="rounded" width="100px" height="19px" />
      </span>
    );
  }

  const icon = getMonitoringIcon(app);
  const Icon = ICONS[icon];

  return (
    <AkTooltip
      color="light"
      arrow
      side="bottom"
      title={
        <div className="max-w-75 p-2">
          <AkTypography color="textSecondary" className="uppercase">
            <AkMessageTranslate id="reason" />
          </AkTypography>

          <AkTypography className="mt-1" data-test-sk-monitoring-reason>
            {getMonitoringReason(app, detectsFakeApps)}{' '}
            {reasonHasDetectedSuffix(app) && <AkMessageTranslate id="storeknox.haveBeenDetected" />}
          </AkTypography>
        </div>
      }
    >
      <span className="flex items-center gap-1" data-test-sk-monitoring-status={icon}>
        <Icon aria-hidden="true" />

        <AkTypography tag="span">{getMonitoringStatusText(app)}</AkTypography>
      </span>
    </AkTooltip>
  );
}
