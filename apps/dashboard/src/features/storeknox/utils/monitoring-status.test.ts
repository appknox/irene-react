import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { buildSkApp } from '@tests/factories';

import {
  getMonitoringIcon,
  getMonitoringReason,
  getMonitoringStatusText,
  reasonHasDetectedSuffix,
} from './monitoring-status';

const { SK_APP_MONITORING_STATUS: STORE, SK_FAKE_APP_DETECTION_STATUS: FAKE } = ENUMS;

const decommissioned = buildSkApp({ app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });
const disabled = buildSkApp({ monitoring_enabled: false });

const bothFound = buildSkApp({
  store_monitoring_status: STORE.ACTION_NEEDED,
  fake_app_detection_status: FAKE.HAS_RESULTS,
});

describe('getMonitoringIcon', () => {
  it('draws the disabled icon for a decommissioned app or one with monitoring off', () => {
    expect(getMonitoringIcon(decommissioned)).toBe('disabled');
    expect(getMonitoringIcon(disabled)).toBe('disabled');
  });

  it('draws the action, initializing or clear icon by what monitoring found', () => {
    expect(getMonitoringIcon(bothFound)).toBe('action-needed');

    expect(getMonitoringIcon(buildSkApp({ store_monitoring_status: STORE.INITIALIZING }))).toBe(
      'initializing'
    );

    expect(getMonitoringIcon(buildSkApp())).toBe('no-action-needed');
  });
});

describe('getMonitoringStatusText', () => {
  it('reads each state', () => {
    expect(getMonitoringStatusText(decommissioned)).toBe(akMT('storeknox.decommissioned'));
    expect(getMonitoringStatusText(bothFound)).toBe(akMT('storeknox.needsAction'));

    expect(
      getMonitoringStatusText(buildSkApp({ fake_app_detection_status: FAKE.INITIALIZING }))
    ).toBe(akMT('storeknox.beingInitialized'));

    expect(getMonitoringStatusText(disabled)).toBe(akMT('disabled'));
    expect(getMonitoringStatusText(buildSkApp())).toBe(akMT('storeknox.noActionNeeded'));
  });
});

describe('getMonitoringReason', () => {
  it('explains a decommissioned or disabled app first', () => {
    expect(getMonitoringReason(decommissioned, true)).toEqual(akMT('storeknox.decommissionedMsg'));
    expect(getMonitoringReason(disabled, true)).toEqual(akMT('storeknox.disabledMsg'));
  });

  it('names what was found: both, fake apps, or unscanned versions', () => {
    expect(getMonitoringReason(bothFound, true)).toEqual(
      akMT('storeknox.unscannedVersionsAndFakeAppsDetectedTitle')
    );

    expect(
      getMonitoringReason(buildSkApp({ fake_app_detection_status: FAKE.HAS_RESULTS }), true)
    ).toEqual(akMT('storeknox.fakeAppsDetectedTitle'));

    expect(
      getMonitoringReason(buildSkApp({ store_monitoring_status: STORE.ACTION_NEEDED }), true)
    ).toEqual(akMT('storeknox.unscannedVersionsTitle'));
  });

  it('says which check is still initializing', () => {
    const both = buildSkApp({
      store_monitoring_status: STORE.INITIALIZING,
      fake_app_detection_status: FAKE.INITIALIZING,
    });

    const fakeOnly = buildSkApp({ fake_app_detection_status: FAKE.INITIALIZING });
    const storeOnly = buildSkApp({ store_monitoring_status: STORE.INITIALIZING });

    const storeWithFakeOff = buildSkApp({
      store_monitoring_status: STORE.INITIALIZING,
      fake_app_detection_status: FAKE.DISABLED,
    });

    expect(getMonitoringReason(both, true)).toEqual(akMT('storeknox.initializingMsg'));
    expect(getMonitoringReason(fakeOnly, true)).toEqual(akMT('storeknox.initializingMsgFakeApp'));

    expect(getMonitoringReason(storeOnly, true)).toEqual(
      akMT('storeknox.initializingMsgStoreMonitoring')
    );

    expect(getMonitoringReason(storeWithFakeOff, true)).toEqual(akMT('storeknox.initializingMsg'));
  });

  it('reports nothing found, naming fake apps only where the organization detects them', () => {
    expect(getMonitoringReason(buildSkApp(), true)).toEqual(
      akMT('storeknox.noUnscannedVersionsOrFakeAppsDetectedMsg')
    );

    expect(getMonitoringReason(buildSkApp(), false)).toEqual(akMT('storeknox.noUnscannedVersions'));
  });
});

describe('reasonHasDetectedSuffix', () => {
  it('adds the suffix where a check has results to report', () => {
    expect(reasonHasDetectedSuffix(buildSkApp())).toBe(true);
    expect(reasonHasDetectedSuffix(bothFound)).toBe(true);

    expect(
      reasonHasDetectedSuffix(buildSkApp({ store_monitoring_status: STORE.INITIALIZING }))
    ).toBe(false);
  });
});
