import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import {
  buildAddedToInventorySkFakeApp,
  buildIgnoredSkFakeApp,
  buildSkFakeApp,
  buildSkFakeAppStore,
} from '@tests/factories';

import {
  canAddFakeAppToInventory,
  fakeAppConfidence,
  hasSuspectedApps,
  isFakeAppAddedToInventory,
  isFakeAppIgnored,
  suspectedShare,
  suspectedTotal,
} from './fake-app';

describe('fake app helpers', () => {
  it('treats ignored and added-to-inventory as ignored, pending as not', () => {
    expect(isFakeAppIgnored(buildIgnoredSkFakeApp())).toBe(true);
    expect(isFakeAppIgnored(buildAddedToInventorySkFakeApp())).toBe(true);
    expect(isFakeAppIgnored(buildSkFakeApp())).toBe(false);

    expect(isFakeAppAddedToInventory(buildAddedToInventorySkFakeApp())).toBe(true);
    expect(isFakeAppAddedToInventory(buildIgnoredSkFakeApp())).toBe(false);
  });

  it('refuses adding apkmody and aptoide copies to the inventory', () => {
    const on = (identifier: 'playstore' | 'appstore' | 'apkmody' | 'aptoide') =>
      buildSkFakeApp({ store: buildSkFakeAppStore({ identifier }) });

    expect(canAddFakeAppToInventory(on('apkmody'))).toBe(false);
    expect(canAddFakeAppToInventory(on('aptoide'))).toBe(false);
    expect(canAddFakeAppToInventory(on('playstore'))).toBe(true);
    expect(canAddFakeAppToInventory(on('appstore'))).toBe(true);
  });

  it('reads confidence as a rounded percentage and null when the final score is missing', () => {
    const final = faker.number.float({ min: 0, max: 1, fractionDigits: 3 });

    expect(fakeAppConfidence(buildSkFakeApp({ ai_scores: { final } }))).toBe(
      Math.round(final * 100)
    );

    expect(fakeAppConfidence(buildSkFakeApp({ ai_scores: {} }))).toBeNull();
    expect(fakeAppConfidence(buildSkFakeApp({ ai_scores: { final: 'high' } }))).toBeNull();
    expect(fakeAppConfidence(buildSkFakeApp({ ai_scores: { final: Number.NaN } }))).toBeNull();
  });

  it('shares nothing when there are no suspected apps', () => {
    expect(suspectedShare(0, 0)).toBe(0);
    expect(suspectedTotal(null)).toBe(0);
    expect(suspectedTotal({ brand_abuse: 2, fake_app: 3, ignored: 4 })).toBe(5);
    expect(suspectedShare(1, 4)).toBe(25);
  });

  it('has no suspected apps when counts are null or all zero', () => {
    expect(hasSuspectedApps(null)).toBe(false);
    expect(hasSuspectedApps({ brand_abuse: 0, fake_app: 0, ignored: 0 })).toBe(false);
    expect(hasSuspectedApps({ brand_abuse: 0, fake_app: 0, ignored: 1 })).toBe(true);
    expect(hasSuspectedApps({ brand_abuse: 1, fake_app: 0, ignored: 0 })).toBe(true);
  });
});
