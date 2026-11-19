import { describe, expect, it } from 'vitest';
import { EMBER_OWNED_PATHS, EMBER_PATHS, findEmberPath } from './paths.ts';

describe('findEmberPath', () => {
  it('maps a path the Ember app still owns', () => {
    expect(findEmberPath('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('returns nothing for a path this app serves', () => {
    expect(findEmberPath('/')).toBeUndefined();
    expect(findEmberPath('/startup-sequence/test')).toBeUndefined();
  });

  it('carries the rest of the path across, so ids reach the Ember app', () => {
    expect(findEmberPath('/dashboard/file/42/analysis/7')).toBe('/dashboard/file/42/analysis/7');
  });

  it('translates a path the two apps spell differently', () => {
    expect(findEmberPath('/security/download-app')).toBe('/security/downloadapp');
    expect(findEmberPath('/security/purge-analysis')).toBe('/security/purgeanalysis');
  });

  /* The root is the one owner that could swallow every path, and does not. */
  it('does not claim a sibling that merely starts with an owned path', () => {
    expect(findEmberPath('/logins')).toBeUndefined();
    expect(findEmberPath('/registered')).toBeUndefined();
  });

  it('claims the pages anyone reaches before signing in', () => {
    expect(findEmberPath('/login')).toBe('/login');
    expect(findEmberPath('/reset/a-token')).toBe('/reset/a-token');
  });

  it('leaves a migrated page alone while owning the pages under it', () => {
    expect(findEmberPath('/dashboard/storeknox')).toBeUndefined();

    expect(findEmberPath('/dashboard/storeknox/third-party-scans')).toBe(
      '/dashboard/storeknox/third-party-scans'
    );
  });

  it('hands over the StoreKnox pages still on Ember and keeps the inventory, discovery and fake apps', () => {
    expect(findEmberPath('/dashboard/storeknox/discover/result')).toBeUndefined();
    expect(findEmberPath('/dashboard/storeknox/fake-apps')).toBeUndefined();
    expect(findEmberPath('/dashboard/storeknox/fake-apps/42')).toBeUndefined();

    expect(findEmberPath('/dashboard/storeknox/third-party-scans/com.example.app')).toBe(
      '/dashboard/storeknox/third-party-scans/com.example.app'
    );

    expect(findEmberPath('/dashboard/storeknox/inventory/app-list')).toBeUndefined();
    expect(findEmberPath('/dashboard/storeknox/inventory-details/42')).toBeUndefined();
  });

  it('prefers the longest owner, so a deeper path is not read as a shallower one', () => {
    expect(findEmberPath('/security/download-app')).toBe('/security/downloadapp');
    expect(findEmberPath('/security/projects')).toBe('/security/projects');
  });

  /* A migrated page leaves the ledger, and is this app's from that edit onwards. */
  it('leaves a page out of the ledger to this app', () => {
    expect(Object.keys(EMBER_PATHS)).not.toContain('/startup-sequence/test');
    expect(findEmberPath('/startup-sequence/test')).toBeUndefined();
  });
});

describe('EMBER_OWNED_PATHS', () => {
  it('holds every destination in the ledger, without repeats', () => {
    expect([...EMBER_OWNED_PATHS].sort()).toStrictEqual(
      [...new Set(Object.values(EMBER_PATHS))].sort()
    );
  });

  it('is ordered longest first, so the most specific owner is tested first', () => {
    const lengths = EMBER_OWNED_PATHS.map((path) => path.length);

    expect(lengths).toStrictEqual([...lengths].sort((one, other) => other - one));
  });

  it('lists only absolute paths with no trailing slash', () => {
    for (const path of EMBER_OWNED_PATHS) {
      expect(path.startsWith('/')).toBe(true);
      expect(path.endsWith('/')).toBe(false);
    }
  });
});
