import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import {
  DetailsSectionHeader,
  DetailsSectionInfo,
} from '@/features/storeknox/components/details-section';

import {
  fakeAppDetectionHasResults,
  fakeAppDetectionIsInitializing,
  isDecommissioned,
  isReadOnly,
  storeMonitoringIsPending,
  storeMonitoringNeedsAction,
} from '@/features/storeknox/utils/sk-app';

import { SkCheckChip } from '@/features/storeknox/components/sk-check-chip';
import { useOrganization } from '@/hooks/use-organization';
import { storeknoxOrganizationOptions } from '@/queries/organization';

interface AppAction {
  id: 'unscanned-version' | 'brand-abuse' | 'malware-detected';
  label: string;
  hidden: boolean;
  needsAction: boolean;
  featureInProgress: boolean;
  showDisabledState: boolean;
  statusIsInitializing: boolean;
  disabled: boolean;
  disabledTooltip: string;
}

/** The tooltip for a check with no results to open: why, by the app's state. */
const _noDataTooltip = (
  app: ApiSkInventoryApp,
  noDataKey: 'storeMonitoring' | 'fakeAppDetection'
) => {
  if (isDecommissioned(app)) {
    return akMT('storeknox.decommissionedActionDisabled');
  }

  return noDataKey === 'storeMonitoring'
    ? akMT('storeknox.noStoreMonitoringDataTooltip')
    : akMT('storeknox.noFakeAppDetectionDataTooltip');
};

/** irene's three checks, with what each says about this app. */
function useAppActions(app: ApiSkInventoryApp): AppAction[] {
  const { hidesUpsell } = useOrganization();
  const { data: storeknoxOrganization } = useQuery(storeknoxOrganizationOptions());
  const detectsFakeApps = Boolean(storeknoxOrganization?.sk_features.fake_app_detection);
  const monitoringOff = !app.monitoring_enabled;

  const storePending = storeMonitoringIsPending(app);
  const storeUnavailable = storePending || (monitoringOff && !app.has_store_monitoring_data);

  const fakePending = fakeAppDetectionIsInitializing(app);
  const fakeUnavailable = fakePending || (monitoringOff && !app.has_fake_app_detection_data);

  const notSold = { needsAction: false, showDisabledState: false, statusIsInitializing: false };

  return [
    {
      id: 'unscanned-version',
      label: akMT('storeknox.unscannedVersion'),
      hidden: false,
      needsAction: storeMonitoringNeedsAction(app),
      featureInProgress: false,
      showDisabledState: monitoringOff,
      statusIsInitializing: storePending,
      disabled: storeUnavailable,
      disabledTooltip: storePending
        ? akMT('storeknox.initializingMsg')
        : _noDataTooltip(app, 'storeMonitoring'),
    },
    detectsFakeApps
      ? {
          id: 'brand-abuse',
          label: akMT('storeknox.fakeAppsTitle'),
          hidden: false,
          needsAction: fakeAppDetectionHasResults(app),
          featureInProgress: false,
          showDisabledState: monitoringOff,
          statusIsInitializing: fakePending,
          disabled: fakeUnavailable,
          disabledTooltip: fakePending
            ? akMT('storeknox.initializingMsg')
            : _noDataTooltip(app, 'fakeAppDetection'),
        }
      : {
          id: 'brand-abuse',
          label: akMT('storeknox.fakeAppsTitle'),
          hidden: hidesUpsell(),
          featureInProgress: true,
          disabled: false,
          disabledTooltip: '',
          ...notSold,
        },
    {
      id: 'malware-detected',
      label: akMT('storeknox.malwareDetected'),
      hidden: hidesUpsell(),
      featureInProgress: true,
      disabled: false,
      disabledTooltip: '',
      ...notSold,
    },
  ];
}

/** The link a check opens; the fake-apps check opens the app's own fake-app list. */
function _ActionLink({
  action,
  appId,
  children,
}: Readonly<{ action: AppAction; appId: number; children: ReactNode }>) {
  const params = { id: String(appId) };

  if (action.disabled) {
    return <span aria-disabled="true">{children}</span>;
  }

  if (action.id === 'unscanned-version') {
    return (
      <Link to="/dashboard/storeknox/inventory-details/$id/unscanned-version" params={params}>
        {children}
      </Link>
    );
  }

  if (action.id === 'brand-abuse' && !action.featureInProgress) {
    return (
      <Link to="/dashboard/storeknox/fake-apps/$skApp" params={{ skApp: String(appId) }}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      to={
        action.id === 'brand-abuse'
          ? '/dashboard/storeknox/inventory-details/$id/brand-abuse'
          : '/dashboard/storeknox/inventory-details/$id/malware-detected'
      }
      params={params}
    >
      {children}
    </Link>
  );
}

/** The checks run on an app with their action counts; unbought checks show as on offer, or are hidden if the organization hides them. */
export function ActionsList({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  const actions = useAppActions(app);

  const actionableCount = actions.filter(
    (action) => action.needsAction && !action.showDisabledState
  ).length;

  return (
    <div className="flex w-full flex-col">
      <DetailsSectionHeader
        color="white"
        className="h-12.5"
        icon={<AkIcon name="material-symbols:auto-graph" className="text-foreground" />}
      >
        <AkTypography fontWeight="medium" data-test-sk-actions-heading>
          <AkMessageTranslate id="storeknox.actionNeeded" />
          {actionableCount > 0 && app.monitoring_enabled && ` (${actionableCount})`}
        </AkTypography>
      </DetailsSectionHeader>

      <DetailsSectionInfo className="items-center gap-2">
        {actions
          .filter((action) => !action.hidden)
          .map((action) => (
            <AkTooltip
              key={action.id}
              disabled={!action.disabled}
              arrow
              side="top"
              title={action.disabledTooltip}
            >
              <span className="inline-flex" data-test-sk-action={action.id}>
                <_ActionLink action={action} appId={app.id}>
                  <SkCheckChip
                    label={action.label}
                    needsAction={action.needsAction}
                    featureInProgress={action.featureInProgress}
                    statusIsInitializing={action.statusIsInitializing}
                    showDisabledState={action.showDisabledState}
                    disabled={action.disabled}
                    readOnly={isReadOnly(app)}
                  />
                </_ActionLink>
              </span>
            </AkTooltip>
          ))}
      </DetailsSectionInfo>
    </div>
  );
}
