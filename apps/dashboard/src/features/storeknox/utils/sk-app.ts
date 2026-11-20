import dayjs from 'dayjs';

import { ENUMS } from '@irene/enums';
import type { ApiSkApp, ApiSkAppMetadata } from '@irene/api/services/storeknox';

/* irene's `SkAppModel` getters as functions of the record, with irene's guards kept exactly. */

/** Whether store monitoring is still gathering its first results. */
export const storeMonitoringIsPending = (app: ApiSkApp) =>
  app.store_monitoring_status === ENUMS.SK_APP_MONITORING_STATUS.INITIALIZING;

/** Whether store monitoring is switched off. */
export const storeMonitoringIsDisabled = (app: ApiSkApp) =>
  app.store_monitoring_status === ENUMS.SK_APP_MONITORING_STATUS.DISABLED;

/** Whether store monitoring found a version on the store that Appknox has not scanned. */
export const storeMonitoringNeedsAction = (app: ApiSkApp) =>
  app.store_monitoring_status === ENUMS.SK_APP_MONITORING_STATUS.ACTION_NEEDED;

/** Whether store monitoring found every store version scanned. */
export const storeMonitoringHasNoActionNeeded = (app: ApiSkApp) =>
  app.store_monitoring_status === ENUMS.SK_APP_MONITORING_STATUS.NO_ACTION_NEEDED;

/** Whether fake-app detection is switched off. */
export const fakeAppDetectionIsDisabled = (app: ApiSkApp) =>
  app.fake_app_detection_status === ENUMS.SK_FAKE_APP_DETECTION_STATUS.DISABLED;

/** Whether fake-app detection is still gathering its first results. */
export const fakeAppDetectionIsInitializing = (app: ApiSkApp) =>
  app.fake_app_detection_status === ENUMS.SK_FAKE_APP_DETECTION_STATUS.INITIALIZING;

/** Whether fake-app detection found nothing. */
export const fakeAppDetectionHasNoResults = (app: ApiSkApp) =>
  app.fake_app_detection_status === ENUMS.SK_FAKE_APP_DETECTION_STATUS.NO_RESULTS;

/** Whether fake-app detection found copies of the app. */
export const fakeAppDetectionHasResults = (app: ApiSkApp) =>
  app.fake_app_detection_status === ENUMS.SK_FAKE_APP_DETECTION_STATUS.HAS_RESULTS;

/** Whether the app is archived. irene requires both the date and the status. */
export const isArchived = (app: ApiSkApp) =>
  Boolean(app.archived_on) && app.app_status === ENUMS.SK_APP_STATUS.ARCHIVED;

/** Whether the app has gone from its store. */
export const isDecommissioned = (app: ApiSkApp) =>
  app.app_status === ENUMS.SK_APP_STATUS.DECOMMISSIONED;

/** Archived or decommissioned: no action can be taken on the app. */
export const isReadOnly = (app: ApiSkApp) => isArchived(app) || isDecommissioned(app);

/** Whether an archived app's lock period has passed, so it can be restored. */
export const canUnarchive = (app: ApiSkApp) =>
  Boolean(app.archived_on) && dayjs().isAfter(app.unarchive_available_on);

/** Whether a monitoring licence is held for the app. */
export const hasLicense = (app: ApiSkApp) => app.license_allocated > 0;

/** Monitoring is on and either check has found something to act on. */
export const needsAction = (app: ApiSkApp) =>
  app.monitoring_enabled && (storeMonitoringNeedsAction(app) || fakeAppDetectionHasResults(app));

/** Monitoring is on and either check is still gathering its first results. */
export const isInitializing = (app: ApiSkApp) =>
  app.monitoring_enabled && (storeMonitoringIsPending(app) || fakeAppDetectionIsInitializing(app));

/** Monitoring is off and neither check has ever produced results to show. */
export const monitoringIsDisabledWithNoResults = (app: ApiSkApp) =>
  !app.monitoring_enabled && !app.has_fake_app_detection_data && !app.has_store_monitoring_data;

/* Anything carrying a store listing's platform: an inventory app, a request, or a search result mapped for a table. */
type _SkListing = { app_metadata: Pick<ApiSkAppMetadata, 'platform'> };

/** Whether the app is an Android listing. */
export const isAndroid = (app: _SkListing) => app.app_metadata.platform === ENUMS.PLATFORM.ANDROID;

/** Whether the app is an App Store listing. */
export const isIos = (app: _SkListing) => app.app_metadata.platform === ENUMS.PLATFORM.IOS;
