import {
  fakeAppDetectionHasResults,
  fakeAppDetectionIsDisabled,
  fakeAppDetectionIsInitializing,
  isDecommissioned,
  isInitializing,
  needsAction,
  storeMonitoringHasNoActionNeeded,
  storeMonitoringIsDisabled,
  storeMonitoringIsPending,
  storeMonitoringNeedsAction,
} from '@/features/storeknox/utils/sk-app';

import { akMT } from '@irene/translations/intl';
import type { ApiSkApp } from '@irene/api/services/storeknox';

/** The icon an app's monitoring status is drawn with. */
export type SkMonitoringIcon = 'disabled' | 'action-needed' | 'initializing' | 'no-action-needed';

/** The icon for an app's monitoring status, as irene's `iconDetails` picks it. */
export function getMonitoringIcon(app: ApiSkApp): SkMonitoringIcon {
  /* irene checks the two disabled cases separately; both draw the same icon. */
  if (isDecommissioned(app) || !app.monitoring_enabled) {
    return 'disabled';
  }

  if (needsAction(app)) {
    return 'action-needed';
  }

  return isInitializing(app) ? 'initializing' : 'no-action-needed';
}

/**
 * The label for an app's monitoring status, as irene's `statusText`; it checks
 * initializing before disabled, the reverse of the icon, and both orders are kept.
 */
export function getMonitoringStatusText(app: ApiSkApp) {
  if (isDecommissioned(app)) {
    return akMT('storeknox.decommissioned');
  }

  if (needsAction(app)) {
    return akMT('storeknox.needsAction');
  }

  if (isInitializing(app)) {
    return akMT('storeknox.beingInitialized');
  }

  return app.monitoring_enabled ? akMT('storeknox.noActionNeeded') : akMT('disabled');
}

/** Why an app is initializing: both checks, or one with the other still running. */
function _initializingReason(app: ApiSkApp) {
  if (fakeAppDetectionIsInitializing(app) && storeMonitoringIsPending(app)) {
    return akMT('storeknox.initializingMsg');
  }

  if (fakeAppDetectionIsInitializing(app) && !storeMonitoringIsDisabled(app)) {
    return akMT('storeknox.initializingMsgFakeApp');
  }

  if (storeMonitoringIsPending(app) && !fakeAppDetectionIsDisabled(app)) {
    return akMT('storeknox.initializingMsgStoreMonitoring');
  }

  return akMT('storeknox.initializingMsg');
}

/** The reason the status tooltip gives, as irene's `tooltipMessage` reads it. */
export function getMonitoringReason(app: ApiSkApp, detectsFakeApps: boolean) {
  const fakeAppsFound = fakeAppDetectionHasResults(app);
  const unscannedFound = storeMonitoringNeedsAction(app);

  if (isDecommissioned(app)) {
    return akMT('storeknox.decommissionedMsg');
  }

  if (!app.monitoring_enabled) {
    return akMT('storeknox.disabledMsg');
  }

  if (unscannedFound && fakeAppsFound) {
    return akMT('storeknox.unscannedVersionsAndFakeAppsDetectedTitle');
  }

  if (fakeAppsFound) {
    return akMT('storeknox.fakeAppsDetectedTitle');
  }

  if (unscannedFound) {
    return akMT('storeknox.unscannedVersionsTitle');
  }

  if (isInitializing(app)) {
    return _initializingReason(app);
  }

  return detectsFakeApps
    ? akMT('storeknox.noUnscannedVersionsOrFakeAppsDetectedMsg')
    : akMT('storeknox.noUnscannedVersions');
}

/** Whether the reason ends "have been detected", as irene's `tooltipSuffix` adds it. */
export const reasonHasDetectedSuffix = (app: ApiSkApp) =>
  storeMonitoringHasNoActionNeeded(app) ||
  storeMonitoringNeedsAction(app) ||
  fakeAppDetectionHasResults(app);
