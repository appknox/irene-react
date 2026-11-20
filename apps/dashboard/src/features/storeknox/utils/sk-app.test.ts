import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { buildArchivedSkApp, buildSkApp, buildSkAppMetadata } from '@tests/factories';

import {
  canUnarchive,
  hasLicense,
  isAndroid,
  isArchived,
  isDecommissioned,
  isInitializing,
  isIos,
  isReadOnly,
  monitoringIsDisabledWithNoResults,
  needsAction,
} from './sk-app';

describe('sk-app states', () => {
  it('reads an app as archived only when it carries both the date and the status', () => {
    expect(isArchived(buildArchivedSkApp())).toBe(true);
    expect(isArchived(buildArchivedSkApp({ archived_on: null }))).toBe(false);
    expect(isArchived(buildSkApp({ archived_on: dayjs().toISOString() }))).toBe(false);
  });

  it('reads an archived or decommissioned app as read-only', () => {
    const decommissioned = buildSkApp({ app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });

    expect(isDecommissioned(decommissioned)).toBe(true);
    expect(isReadOnly(decommissioned)).toBe(true);
    expect(isReadOnly(buildArchivedSkApp())).toBe(true);
    expect(isReadOnly(buildSkApp())).toBe(false);
  });

  it('lets an archived app be restored once its lock period has passed', () => {
    const past = dayjs().subtract(1, 'day').toISOString();
    const future = dayjs().add(1, 'day').toISOString();

    expect(canUnarchive(buildArchivedSkApp({ unarchive_available_on: past }))).toBe(true);
    expect(canUnarchive(buildArchivedSkApp({ unarchive_available_on: future }))).toBe(false);
  });

  it('needs action when monitoring found an unscanned version or fake apps', () => {
    expect(
      needsAction(
        buildSkApp({ store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.ACTION_NEEDED })
      )
    ).toBe(true);

    expect(
      needsAction(
        buildSkApp({
          fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.HAS_RESULTS,
          monitoring_enabled: false,
        })
      )
    ).toBe(false);
  });

  it('initializes while either check is still gathering results with monitoring on', () => {
    expect(
      isInitializing(
        buildSkApp({
          fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.INITIALIZING,
        })
      )
    ).toBe(true);

    expect(isInitializing(buildSkApp())).toBe(false);
  });

  it('reads monitoring as off with nothing to show only when neither check has data', () => {
    const off = { monitoring_enabled: false };

    expect(
      monitoringIsDisabledWithNoResults(
        buildSkApp({ ...off, has_store_monitoring_data: false, has_fake_app_detection_data: false })
      )
    ).toBe(true);

    expect(monitoringIsDisabledWithNoResults(buildSkApp(off))).toBe(false);
  });

  it('holds a licence while one is allocated', () => {
    expect(hasLicense(buildSkApp({ license_allocated: 1 }))).toBe(true);
    expect(hasLicense(buildSkApp({ license_allocated: 0 }))).toBe(false);
  });

  it('tells an Android listing from an App Store one', () => {
    const android = buildSkApp({
      app_metadata: buildSkAppMetadata({ platform: ENUMS.PLATFORM.ANDROID }),
    });

    expect(isAndroid(android)).toBe(true);
    expect(isIos(android)).toBe(false);
  });
});
